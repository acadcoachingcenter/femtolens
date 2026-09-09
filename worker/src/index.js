const EUTILS = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

// AI_PROVIDER: 'groq' (free tier, default) or 'anthropic' (set as a var in wrangler.toml
// once you're ready to move — no code change needed, just flip the var + secret).
const GROQ_MODEL = 'openai/gpt-oss-120b'
const ANTHROPIC_MODEL = 'claude-sonnet-5'

function cors(env) {
  const origin = env.CORS_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(env) })
    }

    try {
      if (url.pathname === '/api/plan' && request.method === 'POST') {
        return json(await handlePlan(await request.json(), env), env)
      }
      if (url.pathname === '/api/search' && request.method === 'POST') {
        return json(await handleSearch(await request.json(), env), env)
      }
      if (url.pathname === '/api/synthesize' && request.method === 'POST') {
        return json(await handleSynthesize(await request.json(), env), env)
      }
      if (url.pathname === '/api/health') {
        return json({ ok: true, service: 'femtolens-worker' }, env)
      }
      return json({ error: 'Not found' }, env, 404)
    } catch (err) {
      return json({ error: err.message || 'Internal error' }, env, 500)
    }
  },
}

// ---------- LLM helper (Groq by default, Anthropic as a drop-in swap later) ----------

async function callLLM(env, { system, prompt, maxTokens = 1500, json: wantJson = true }) {
  const provider = (env.AI_PROVIDER || 'groq').toLowerCase()
  if (provider === 'anthropic') return callAnthropic(env, { system, prompt, maxTokens })
  return callGroq(env, { system, prompt, maxTokens, wantJson })
}

async function callGroq(env, { system, prompt, maxTokens, wantJson }) {
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
      // gpt-oss is a reasoning model; keep its reasoning trace out of the
      // returned content so `content` is clean JSON, not chain-of-thought.
      reasoning_format: 'hidden',
      ...(wantJson ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
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

// ---------- /api/plan ----------

async function handlePlan({ question, type, depth }, env) {
  if (!question || !question.trim()) throw new Error('A research question is required.')

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

  const raw = await callLLM(env, { system, prompt, maxTokens: 1200 })
  const plan = extractJson(raw)
  if (!plan.investigationAreas) plan.investigationAreas = []
  return plan
}

// ---------- /api/search (PubMed) ----------

async function handleSearch({ question, type, areas, limit }, env) {
  if (!question || !question.trim()) throw new Error('A research question is required.')
  const retmax = Math.min(Math.max(Number(limit) || 12, 3), 30)

  const term = buildPubMedTerm(question, areas)
  const esearchUrl = `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(term)}`
  const esearchRes = await fetch(esearchUrl, { headers: { 'User-Agent': 'FEMTOLENS/1.0' } })
  if (!esearchRes.ok) throw new Error(`PubMed search failed (${esearchRes.status})`)
  const esearchData = await esearchRes.json()
  const idList = esearchData.esearchresult?.idlist || []
  const totalFound = Number(esearchData.esearchresult?.count || idList.length)

  if (idList.length === 0) {
    return { papers: [], meta: { databases: ['PubMed'], totalFound: 0, dateRange: null, query: term } }
  }

  const ids = idList.join(',')

  const [summaryData, abstracts] = await Promise.all([
    fetchEsummary(ids),
    fetchAbstracts(ids),
  ])

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

  return {
    papers,
    meta: {
      databases: ['PubMed', 'PubMed Central (via linked full text)'],
      totalFound,
      included: papers.length,
      query: term,
    },
  }
}

function buildPubMedTerm(question, areas) {
  // Use the question directly; PubMed's automatic term mapping handles natural language reasonably well.
  // Keep it concise to avoid over-constraining recall.
  return question
}

async function fetchEsummary(ids) {
  const url = `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids}`
  const res = await fetch(url, { headers: { 'User-Agent': 'FEMTOLENS/1.0' } })
  if (!res.ok) throw new Error(`PubMed summary failed (${res.status})`)
  return res.json()
}

async function fetchAbstracts(ids) {
  const url = `${EUTILS}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=${ids}`
  const res = await fetch(url, { headers: { 'User-Agent': 'FEMTOLENS/1.0' } })
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

// ---------- /api/synthesize ----------

async function handleSynthesize({ question, type, papers }, env) {
  if (!papers || papers.length === 0) throw new Error('No papers provided to synthesize.')

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

  const raw = await callLLM(env, { system, prompt, maxTokens: 4000 })
  const synthesis = extractJson(raw)
  return synthesis
}
