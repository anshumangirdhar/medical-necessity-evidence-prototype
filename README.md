# Medical Necessity Evidence Prototype

A Next.js prototype that takes synthetic recorded inpatient-psychiatry stays and produces a structured medical-necessity evidence file. It evaluates each criterion an insurer weighs to approve a continued inpatient psychiatric stay, marks each as supported / partially supported / not supported, links every supported point to the exact transcript moment (click to jump and highlight), flags documentation gaps, and exports a review packet.

> **Synthetic data only.** No real patient information is used or stored anywhere in this application. All patient records and transcripts are entirely fictional and created for demonstration purposes.

## What it does

- Lists **five continued-stay criteria** (risk/safety, functional impairment, deterioration risk, treatment response, less restrictive alternatives)
- Uses **Claude claude-sonnet-4-6 with tool use** to extract verbatim evidence quotes from transcripts for each criterion
- **Verifies** every quoted excerpt is a real verbatim substring of the cited segment — fabricated or paraphrased quotes are automatically dropped
- Shows **evidence chips** that, when clicked, jump the transcript pane to the exact cited moment and highlight the quoted text
- Flags **documentation gaps** for any criterion lacking supporting evidence
- Generates a **printable review packet** (print to PDF via browser)

The model never decides medical necessity or makes coverage decisions — it finds and links transcript evidence only. All clinical determinations are made by the reviewing team.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Copy the env file and add your API key
cp .env.local.example .env.local
# Edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Run the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

Tests verify the quote-verification logic: fabricated quotes are dropped, verbatim quotes pass, and metadata is correctly filled from real segment data.

## File structure

```
data/
  fixtures/          — synthetic stay JSON files (3 scenarios)
  cache/             — generated evidence files cached here (gitignored)
lib/
  types.ts           — shared TypeScript types
  rubric.ts          — the 5 continued-stay criteria
  stays.ts           — fixture loader
  extract.ts         — Claude API extraction pipeline
  verify.ts          — post-extraction verbatim verification
  evidenceFile.ts    — assembles final EvidenceFile
app/
  page.tsx           — stay picker home page
  api/generate/      — POST endpoint: runs extraction + returns EvidenceFile
  api/stay/[id]/     — GET endpoint: serves fixture data to client
  stay/[id]/         — two-pane evidence review UI
  stay/[id]/packet/  — print/export view
components/
  CriterionRow       — single criterion with status, rationale, chips, gap
  StatusBadge        — supported / partial / not supported badge
  EvidenceChip       — clickable chip linking to transcript moment
  TranscriptPane     — scrollable transcript with highlight interaction
  GapsSection        — gaps summary at page bottom
__tests__/
  verify.test.ts     — unit tests for the verification pipeline
```

## Three fixture scenarios

| Fixture | Label | Patient | Scenario |
|---|---|---|---|
| `stay-supported.json` | Clearly supported | T.K. | Bipolar I, day 4. All 5 criteria clearly supported. Recent PHP failure, active 1:1, meds mid-titration. |
| `stay-gaps.json` | Strong case, one gap | R.M. | MDD with psychotic features, day 5. Strong on most criteria; no prior levels of care documented. |
| `stay-borderline.json` | Borderline / improving | D.W. | GAD with depression, day 7. Patient improving, future-oriented, stable on meds. Several criteria not supported. |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key (server-side only) |

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS**
- **@anthropic-ai/sdk** — claude-sonnet-4-6 with tool use for structured JSON output
- **Jest + ts-jest** — unit tests
- No database — fixtures are JSON files, evidence files cache to `data/cache/`
