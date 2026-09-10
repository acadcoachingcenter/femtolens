import { signSession, verifySession, bearerToken } from './auth.js'
import { TIERS, depthAllowed, publicTierList } from './tiers.js'
import { upsertGoogleUser, getUserById, getActiveSubscription, incrementRunUsage, recordGroqUsage, getGroqUsage, createRun, updateRun, listRuns, getRun, setRunSaved } from './db.js'

const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

// AI_PROVIDER: 'groq' (free tier, default) or 'anthropic' (set as a var in wrangler.toml
// once you're ready to move — no code change needed, just flip the var + secret).
const GROQ_MODEL = 'openai/gpt-oss-120b'
const ANTHROPIC_MODEL = 'claude-sonnet-5'

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function cors(env) {
  const origin = env.CORS_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  })
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(env) })
    }

    try {
      if (url.pathname === '/api/plan' && request.method === 'POST') {
        return json(await handlePlan(await request.json(), env, ctx), env)
      }
      if (url.pathname === '/api/search' && request.method === 'POST') {
        return json(await handleSearch(await request.json(), env, ctx, request), env)
      }
      if (url.pathname === '/api/synthesize' && request.method === 'POST') {
        return json(await handleSynthesize(await request.json(), env, ctx, request), env)
      }
      if (url.pathname === '/api/auth/google' && request.method === 'POST') {
        return json(await handleGoogleAuth(await request.json(), env), env)
      }
      if (url.pathname === '/api/me' && request.method === 'GET') {
        return json(await handleMe(request, env), env)
      }
      if (url.pathname === '/api/tiers' && request.method === 'GET') {
        return json({ tiers: publicTierList() }, env)
      }
      if (url.pathname === '/api/usage' && request.method === 'GET') {
        return json(await handleUsage(env), env)
      }
      if (url.pathname === '/api/research' && request.method === 'POST') {
        return json(await handleCreateRun(await request.json(), env, request), env)
      }
      if (url.pathname === '/api/research' && request.method === 'GET') {
        return json(await handleListRuns(request, env, url), env)
      }
      {
        const runMatch = url.pathname.match(/^\/api\/research\/([^/]+)$/)
        if (runMatch && request.method === 'GET') {
          return json(await handleGetRun(runMatch[1], request, env), env)
        }
        if (runMatch && request.method === 'PATCH') {
          return json(await handleUpdateRun(runMatch[1], await request.json(), request, env), env)
        }
        const saveMatch = url.pathname.match(/^\/api\/research\/([^/]+)\/save$/)
        if (saveMatch && request.method === 'PATCH') {
          return json(await handleSaveRun(saveMatch[1], await request.json(), request, env), env)
        }
      }
      if (url.pathname === '/api/health') {
        return json({ ok: true, service: 'femtolens-worker' }, env)
      }
      return json({ error: 'Not found' }, env, 404)
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 500
      return json({ error: err.message || 'Internal error', code: err.code || undefined }, env, status)
    }
  },
}

// ---------- Auth helpers ----------

async function requireUser(request, env) {
  const token = bearerToken(request)
  if (!token) throw new ApiError('Sign in to run research.', 401)
  const payload = await verifySession(token, env.SESSION_SECRET || 'dev-secret-change-me')
  if (!payload) throw new ApiError('Your session has expired. Please sign in again.', 401)
  const user = await getUserById(env.DB, payload.sub)
  if (!user) throw new ApiError('Account not found. Please sign in again.', 401)
  return user
}

// ---------- LLM helper (Groq by default, Anthropic as a drop-in swap later) ----------

async function callLLM(env, ctx, { system, prompt, maxTokens = 1500, json: wantJson = true }) {
  const provider = (env.AI_PROVIDER || 'groq').toLowerCase()
  if (provider === 'anthropic') return callAnthropic(env, { system, prompt, maxTokens })
  return callGroq(env, ctx, { system, prompt, maxTokens, wantJson })
}

async function callGroq(env, ctx, { system, prompt, maxTokens, wantJson }) {
  if (!env.GROQ_API_KEY) {
    throw new Error('Server is missing GROQ_API_KEY. Set it with `wrangler secret put GROQ_API_KEY` (free key from console.groq.com).')
  }
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      reasoning_format: 'hidden',
      ...(wantJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (env.DB && ctx) {
    ctx.waitUntil(recordGroqUsage(env.DB, res.headers).catch(() => {}))
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Groq API error (${res.status}): ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callAnthropic(env, { system, prompt, maxTokens }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('Server is missing ANTHROPIC_API_KEY. Set it with `wrangler secret put ANTHROPIC_API_KEY`.')
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Claude API error (${res.status}): ${text.slice(0, 400)}`)
  }
  const data = await res.json()
  const textBlock = data.content?.find((b) => b.type === 'text')
  return textBlock?.text || ''
}

function extractJson(raw) {
  let s = raw.trim()
  s = s.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Model did not return JSON')
  return JSON.parse(s.slice(start, end + 1))
}

// ---------- /api/auth/google ----------

async function handleGoogleAuth({ idToken }, env) {
  if (!idToken) throw new ApiError('Missing Google ID token.', 400)
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError('Server is missing GOOGLE_CLIENT_ID.', 500)

  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!verifyRes.ok) throw new ApiError('Could not verify Google sign-in.', 401)
  const payload = await verifyRes.json()

  if (payload.aud !== env.GOOGLE_CLIENT_ID) throw new ApiError('Google sign-in was issued for a different app.', 401)
  if (!payload.sub || !payload.email) throw new ApiError('Google sign-in response was incomplete.', 401)
  if (payload.exp && Number(payload.exp) * 1000 < Date.now()) throw new ApiError('Google sign-in token expired, please try again.', 401)

  const user = await upsertGoogleUser(env.DB, {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  })
  const sub = await getActiveSubscription(env.DB, user.id)

  const sessionToken = await signSession(
    { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    env.SESSION_SECRET || 'dev-secret-change-me'
  )

  return {
    token: sessionToken,
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
    subscription: subscriptionView(sub),
  }
}

// ---------- /api/me ----------

async function handleMe(request, env) {
  const user = await requireUser(request, env)
  const sub = await getActiveSubscription(env.DB, user.id)
  return {
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
    subscription: subscriptionView(sub),
  }
}

function subscriptionView(sub) {
  const tier = TIERS[sub.tier] || TIERS.trial
  return {
    tier: sub.tier,
    label: tier.label,
    runsUsed: sub.runs_used,
    runsLimit: tier.runsPerPeriod,
    maxDepth: tier.maxDepth,
    periodEnd: sub.period_end,
  }
}

// ---------- /api/usage (Groq free-tier gauge) ----------

async function handleUsage(env) {
  if (!env.DB) return { available: false }
  const row = await getGroqUsage(env.DB)
  if (!row || row.limit_requests === null) return { available: false }
  return {
    available: true,
    requests: { limit: row.limit_requests, remaining: row.remaining_requests },
    tokens: { limit: row.limit_tokens, remaining: row.remaining_tokens },
    updatedAt: row.updated_at,
  }
}

// ---------- /api/research (Active Research) ----------

async function handleCreateRun(body, env, request) {
  const user = await requireUser(request, env)
  const { question, type, depth, plan } = body
  if (!question || !question.trim()) throw new ApiError('A research question is required.', 400)
  const id = crypto.randomUUID()
  await createRun(env.DB, { id, userId: user.id, question, type, depth, plan })
  return { id }
}

async function handleListRuns(request, env, url) {
  const user = await requireUser(request, env)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const search = url.searchParams.get('q') || ''
  const status = url.searchParams.get('status') || ''
  const rows = await listRuns(env.DB, user.id, { limit: limit + 1, offset, search, status })
  const hasMore = rows.length > limit
  const trimmed = rows.slice(0, limit)
  return {
    runs: trimmed.map((r) => ({
      id: r.id,
      question: r.question,
      type: r.type,
      depth: r.depth,
      status: r.status,
      saved: !!r.saved,
      hasReport: !!r.has_papers,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    hasMore,
  }
}

async function handleGetRun(id, request, env) {
  const user = await requireUser(request, env)
  const row = await getRun(env.DB, id, user.id)
  if (!row) throw new ApiError('Research run not found.', 404)
  return {
    id: row.id,
    question: row.question,
    type: row.type,
    depth: row.depth,
    status: row.status,
    error: row.error,
    saved: !!row.saved,
    plan: row.plan_json ? JSON.parse(row.plan_json) : null,
    papers: row.papers_json ? JSON.parse(row.papers_json) : null,
    synthesis: row.synthesis_json ? JSON.parse(row.synthesis_json) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function handleUpdateRun(id, body, request, env) {
  const user = await requireUser(request, env)
  const { status, papers, synthesis, error } = body
  if (!['running', 'completed', 'failed'].includes(status)) throw new ApiError('Invalid status.', 400)
  await updateRun(env.DB, id, user.id, { status, papers, synthesis, error })
  return { ok: true }
}

async function handleSaveRun(id, body, request, env) {
  const user = await requireUser(request, env)
  await setRunSaved(env.DB, id, user.id, !!body.saved)
  return { ok: true }
}

// ---------- /api/plan ----------

async function handlePlan({ question, type, depth }, env, ctx) {
  if (!question || !question.trim()) throw new ApiError('A research question is required.', 400)

  const system = `You are the Research Planning Agent inside FEMTOLENS, a medical research intelligence platform.
Given a medical/biomedical research question, produce a structured research plan.
Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly this shape:
{
  "question": "<restated, precise research question>",
  "pico": { "population": "", "intervention": "", "comparator": "", "outcome": "" },
  "investigationAreas": ["...", "..."]
}
Rules:
- "investigationAreas" should have 6-10 concrete, specific investigation steps (e.g. "Identify randomized controlled trials on X", "Compare adverse event rates across trials").
- If the question is not a clinical intervention question, PICO fields may be short phrases describing the equivalent framing (topic/exposure/context/outcome) rather than forced clinical PICO — never leave a field blank, write "Not applicable" if truly not applicable.
- Do not fabricate citations, numbers, or named studies in the plan — this step is scoping only.
- Keep language precise and clinical/scientific in register.`

  const prompt = `Research question: ${question}
Research type: ${type || 'General Medical Research'}
Research depth: ${depth || 'standard'}`

  const raw = await callLLM(env, ctx, { system, prompt, maxTokens: 1200 })
  const plan = extractJson(raw)
  if (!plan.investigationAreas) plan.investigationAreas = []
  return plan
}

// ---------- /api/search (PubMed) — requires sign-in + tier gating ----------

async function handleSearch({ question, type, areas, depth, limit }, env, ctx, request) {
  if (!question || !question.trim()) throw new ApiError('A research question is required.', 400)

  const user = await requireUser(request, env)
  const sub = await getActiveSubscription(env.DB, user.id)
  const tier = TIERS[sub.tier] || TIERS.trial

  if (!depthAllowed(sub.tier, depth || 'standard')) {
    throw new ApiError(
      `Your ${tier.label} plan supports up to "${tier.maxDepth}" depth. Upgrade for this depth.`,
      403
    )
  }
  if (sub.runs_used >= tier.runsPerPeriod) {
    throw new ApiError(
      `You've used all ${tier.runsPerPeriod} research runs on your ${tier.label} plan this period. Upgrade for more.`,
      403
    )
  }

  const retmax = Math.min(Math.max(Number(limit) || 12, 3), 30)

  const term = buildPubMedTerm(question, areas)
  const esearchUrl = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(term)}&${eutilsParams(env)}`
  const esearchRes = await fetchWithRetry(esearchUrl)
  if (!esearchRes.ok) throw new Error(`PubMed search failed (${esearchRes.status})`)
  const esearchData = await esearchRes.json()
  const idList = esearchData.esearchresult?.idlist || []
  const totalFound = Number(esearchData.esearchresult?.count || idList.length)

  if (idList.length === 0) {
    return { papers: [], meta: { databases: ['PubMed'], totalFound: 0, dateRange: null, query: term } }
  }

  const ids = idList.join(',')

  const summaryData = await fetchEsummary(ids, env)
  const abstracts = await fetchAbstracts(ids, env)

  const papers = idList.map((pmid) => {
    const s = summaryData.result?.[pmid]
    if (!s) return null
    const authors = (s.authors || []).map((a) => a.name).filter(Boolean).join(', ')
    const doiEntry = (s.articleids || []).find((a) => a.idtype === 'doi')
    const year = (s.pubdate || '').match(/\d{4}/)?.[0] || ''
    const pubtypes = s.pubtype || []
    return {
      pmid,
      title: cleanTitle(s.title),
      authors: authors || 'Authors not listed',
      journal: s.fulljournalname || s.source || 'Unknown journal',
      year,
      doi: doiEntry?.value || null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      studyType: classifyStudy(pubtypes),
      abstract: abstracts[pmid] || null,
    }
  }).filter(Boolean)

  await incrementRunUsage(env.DB, user.id)

  return {
    papers,
    meta: {
      databases: ['PubMed', 'PubMed Central (via linked full text)'],
      totalFound,
      included: papers.length,
      query: term,
      quota: { tier: sub.tier, runsUsed: sub.runs_used + 1, runsLimit: tier.runsPerPeriod },
    },
  }
}

function buildPubMedTerm(question, areas) {
  return question
}

function eutilsParams(env) {
  const params = { tool: 'femtolens', email: 'hr.skylinepixelstudio@gmail.com' }
  if (env.NCBI_API_KEY) params.api_key = env.NCBI_API_KEY
  return new URLSearchParams(params).toString()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchWithRetry(url, retries = 3, baseDelayMs = 600) {
  let lastRes
  for (let attempt = 0; attempt <= retries; attempt++) {
    lastRes = await fetch(url, { headers: { 'User-Agent': 'FEMTOLENS/1.0 (hr.skylinepixelstudio@gmail.com)' } })
    if (lastRes.status !== 429) return lastRes
    if (attempt < retries) await sleep(baseDelayMs * (attempt + 1))
  }
  return lastRes
}

async function fetchEsummary(ids, env) {
  const url = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids}&${eutilsParams(env)}`
  const res = await fetchWithRetry(url)
  if (!res.ok) throw new Error(`PubMed summary failed (${res.status})`)
  return res.json()
}

async function fetchAbstracts(ids, env) {
  const url = `${EUTILS}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=${ids}&${eutilsParams(env)}`
  const res = await fetchWithRetry(url)
  if (!res.ok) return {}
  const xml = await res.text()
  const map = {}
  const articleBlocks = xml.split('<PubmedArticle>').slice(1)
  for (const block of articleBlocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)
    if (!pmidMatch) continue
    const pmid = pmidMatch[1]
    const abstractParts = [...block.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)]
      .map((m) => stripTags(m[1]).trim())
      .filter(Boolean)
    if (abstractParts.length) {
      map[pmid] = abstractParts.join(' ')
    }
  }
  return map
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function cleanTitle(t) {
  if (!t) return 'Untitled'
  return stripTags(t).replace(/\.$/, '')
}

function classifyStudy(pubtypes = []) {
  const lower = pubtypes.map((p) => p.toLowerCase())
  if (lower.some((p) => p.includes('meta-analysis'))) return 'meta-analysis'
  if (lower.some((p) => p.includes('systematic review'))) return 'systematic-review'
  if (lower.some((p) => p.includes('randomized controlled trial'))) return 'rct'
  if (lower.some((p) => p.includes('case reports'))) return 'case-report'
  if (lower.some((p) => p.includes('observational study'))) return 'observational'
  if (lower.some((p) => p.includes('review'))) return 'review'
  if (lower.some((p) => p.includes('comparative study') || p.includes('multicenter study'))) return 'cohort'
  return 'other'
}

// ---------- /api/synthesize — requires a signed-in session ----------

async function handleSynthesize({ question, type, papers }, env, ctx, request) {
  await requireUser(request, env)
  if (!papers || papers.length === 0) throw new ApiError('No papers provided to synthesize.', 400)

  const trimmed = papers.slice(0, 30).map((p) => ({
    pmid: p.pmid,
    title: p.title,
    year: p.year,
    journal: p.journal,
    studyType: p.studyType,
    abstract: p.abstract ? p.abstract.slice(0, 1800) : null,
  }))

  const system = `You are the Evidence Synthesis Agent inside FEMTOLENS, a medical research intelligence platform.
You will be given a research question and a fixed list of real PubMed papers (with PMID, title, journal, year, study type, and abstract text where available).

STRICT GROUNDING RULES — these override everything else:
- Use ONLY the supplied papers. Never invent, assume, or reference any paper, author, statistic, or trial not present in the supplied list.
- Every entry in "keyFindings" must include "supportingPmids": an array of PMIDs from the supplied list that support it. Never invent a PMID.
- If a paper has no abstract text, do not fabricate its methodology or results — you may still classify/list it, but avoid making numeric claims about it. State "abstract not available" if relevant instead of guessing.
- If the supplied evidence is too thin or inconsistent to support a claim, say so explicitly (e.g. in limitations or researchGaps) rather than inventing certainty.
- Do not provide individualized treatment or diagnostic recommendations. This is a research synthesis, not clinical guidance.

Respond with ONLY a single JSON object (no prose, no markdown fences) matching exactly this shape:
{
  "title": "<short report title>",
  "background": "<2-4 sentences of context for a researcher>",
  "searchStrategySummary": "<1-3 sentences describing what was searched and why, referencing PubMed>",
  "studies": [
    {
      "pmid": "<pmid from supplied list>",
      "studyType": "<one of: systematic-review, meta-analysis, rct, cohort, case-control, cross-sectional, observational, case-report, review, other>",
      "population": "<short>",
      "comparator": "<short, or 'Not reported'>",
      "duration": "<short, or 'Not reported'>",
      "primaryOutcome": "<short>",
      "result": "<short factual summary of the result actually stated in the abstract, or 'Not reported in abstract'>"
    }
  ],
  "keyFindings": [
    { "statement": "<finding grounded in the supplied abstracts>", "supportingPmids": ["..."] }
  ],
  "conflictingEvidence": [
    {
      "topic": "<what the studies disagree about>",
      "positions": [ { "summary": "<position>", "supportingPmids": ["..."] } ],
      "possibleReasons": ["<methodological reason for the disagreement>"]
    }
  ],
  "synthesisNarrative": "<a few paragraphs synthesizing across the supplied studies, noting where they agree/disagree>",
  "limitations": ["<limitation of the overall evidence base, e.g. short follow-up, small samples>"],
  "researchGaps": ["<specific, concrete gap suggested by what's missing across these papers>"],
  "conclusion": "<balanced 2-4 sentence conclusion, explicitly noting this is a research summary, not clinical guidance>"
}
If there is no meaningful disagreement across the supplied studies, return "conflictingEvidence": [].
Include a "studies" entry for every paper you were given, using its exact supplied "pmid".`

  const prompt = `Research question: ${question}
Research type: ${type || 'General Medical Research'}

Supplied papers (JSON):
${JSON.stringify(trimmed, null, 2)}`

  const raw = await callLLM(env, ctx, { system, prompt, maxTokens: 4000 })
  const synthesis = extractJson(raw)
  return synthesis
}
