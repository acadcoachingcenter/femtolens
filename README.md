# FEMTOLENS

"A deeper lens into medical research." An AI-powered medical/biomedical research
intelligence platform: research question → PICO plan → real PubMed literature
search → grounded evidence synthesis → cited research report.

## What's actually built (Phase 1 MVP)

- Landing page + full research dashboard shell (sidebar nav matches the full
  spec; only the Research pipeline is wired to real data — other sections show
  a "coming soon" panel so nothing pretends to work that doesn't).
- **Research Planning Agent** — Claude drafts a PICO framework + investigation
  areas from the question (editable before search runs).
- **Literature Discovery** — real, live PubMed search via NCBI E-utilities
  (esearch → esummary → efetch). No mock papers; every PMID/DOI/author/journal
  is genuine metadata from PubMed.
- **Evidence Extraction / Study Comparison / Synthesis** — Claude synthesizes
  strictly from the fetched abstracts, with claim → PMID grounding, conflicting
  evidence detection, limitations, and research gaps. The system prompt
  forbids inventing papers, PMIDs, or statistics not present in the fetched set.
- **Research Report** — study characteristics table, key findings with
  expandable source cards, conflicting evidence panel, references in Vancouver
  format (computed from real metadata, not AI-generated), export to .txt /
  BibTeX / RIS.
- Persistent safety framing: "research tool, not clinical guidance" disclaimer
  on the input screen and every report.

Not built in this pass (left as clearly-labeled placeholders per the original
spec's own phased rollout): auth, Clinical Trial Explorer, Disease/Drug/Gene
intelligence pages, knowledge graph, research alerts, document upload,
literature review (PRISMA) workflow, multi-database connectors beyond PubMed.
These are Phase 2/3 in the original brief — happy to build any of them next.

## Stack

- **Frontend**: React + Vite + Tailwind, deployed as a Cloudflare Pages
  static site (`/app`, build output `dist`).
- **Backend**: Cloudflare Worker (`/worker`) — three endpoints:
  - `POST /api/plan` — Claude drafts the PICO research plan
  - `POST /api/search` — live PubMed E-utilities search + abstract fetch
  - `POST /api/synthesize` — Claude synthesizes evidence, grounded in the
    fetched abstracts only
- **AI**: Anthropic API (your own API key, set as a Worker secret — this is a
  standalone deployment, not run inside claude.ai, so it needs a real key from
  console.anthropic.com).

## Local dev

```powershell
# Frontend
cd app
npm install
npm run dev

# Worker (separate terminal)
cd worker
npm install
wrangler dev
```

Create `app/.env.local` with `VITE_API_BASE=http://localhost:8787` to point
the dev frontend at the local worker.

## Environment variables / secrets

Worker:
- `ANTHROPIC_API_KEY` (secret) — from console.anthropic.com
- `CORS_ORIGIN` (var, in `wrangler.toml`) — set to your Pages domain

Frontend (Cloudflare Pages dashboard → Settings → Environment variables):
- `VITE_API_BASE` — the deployed Worker URL, e.g. `https://api-femtolens.acadapp.in`
