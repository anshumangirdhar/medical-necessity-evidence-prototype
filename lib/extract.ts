import Anthropic from "@anthropic-ai/sdk";
import { Stay, Criterion } from "./types";
import { RUBRIC } from "./rubric";

const MODEL_ID = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You assemble medical-necessity evidence for a continued inpatient psychiatric stay.
You DO NOT decide medical necessity or whether a claim should be approved or denied.
Your job is to find, for each criterion, what the recorded conversation and the EHR actually say, and to link each point to its exact source.

You are given:
- CRITERIA: five criteria, each with positive and negative indicators.
- ENCOUNTERS: the stay's recorded sessions. Each segment has an id, a timestamp, a speaker, and text.
- EHR: a short structured record for the stay.

For EACH criterion, return:
- status: "supported", "partially_supported", or "not_supported".
- evidence: an array of items, each with the segmentId you took it from and a quote.
- rationale: one or two plain sentences describing what the evidence shows. Do not state a coverage decision or say the criterion "is met."
- confidence: a number from 0 to 1.
- gap: when status is partial or not_supported, one sentence on what is missing.

Rules you must follow exactly:
1. A quote must be copied VERBATIM from a single segment's text. Do not paraphrase inside a quote. Do not merge text from two segments.
2. Always name the segmentId each quote came from.
3. If the conversation does not support a criterion, return status "not_supported", an empty evidence array, and a gap. Never invent or infer support that was not spoken or recorded.
4. Use the EHR for context, but evidence quotes come from transcript segments.
5. Return ALL FIVE criteria, in the order given.
6. Output ONLY the JSON object defined by the schema. No other text.`;

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_evidence",
  description:
    "Extract and structure medical-necessity evidence from stay transcripts.",
  input_schema: {
    type: "object" as const,
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterionId: { type: "string" },
            status: {
              type: "string",
              enum: ["supported", "partially_supported", "not_supported"],
            },
            evidence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  segmentId: { type: "string" },
                  quote: { type: "string" },
                  speaker: { type: "string" },
                },
                required: ["segmentId", "quote", "speaker"],
              },
            },
            rationale: { type: "string" },
            confidence: { type: "number" },
            gap: { type: ["string", "null"] },
          },
          required: [
            "criterionId",
            "status",
            "evidence",
            "rationale",
            "confidence",
          ],
        },
      },
    },
    required: ["results"],
  },
};

interface RawEvidenceItem {
  segmentId: string;
  quote: string;
  speaker: string;
}

interface RawResult {
  criterionId: string;
  status: string;
  evidence: RawEvidenceItem[];
  rationale: string;
  confidence: number;
  gap?: string | null;
}

export interface RawExtractionOutput {
  results: RawResult[];
  modelId: string;
}

function buildUserMessage(stay: Stay, rubric: Criterion[]): string {
  const criteriaText = rubric
    .map(
      (c) => `
CRITERION: ${c.id}
Name: ${c.name}
Definition: ${c.definition}
Positive indicators: ${c.positiveIndicators.join("; ")}
Negative indicators: ${c.negativeIndicators.join("; ")}
`
    )
    .join("\n---\n");

  const encountersText = stay.encounters
    .map((enc) => {
      const segsText = enc.segments
        .map(
          (seg) =>
            `  [${seg.id}] t=${seg.startSec}s speaker=${seg.speaker}: ${seg.text}`
        )
        .join("\n");
      return `ENCOUNTER ${enc.id} (type=${enc.type}, date=${enc.date})\n${segsText}`;
    })
    .join("\n\n");

  const ehrText = `
EHR RECORD:
Patient: ${stay.ehr.patientPseudonym}
Admission date: ${stay.ehr.admissionDate}
Day of stay: ${stay.ehr.dayOfStay}
Primary diagnosis: ${stay.ehr.primaryDx}
Prior levels of care: ${
    stay.ehr.priorLevelsOfCare.length > 0
      ? stay.ehr.priorLevelsOfCare
          .map((p) => `${p.setting} (${p.date}): ${p.outcome}`)
          .join("; ")
      : "None documented"
  }
Medications: ${stay.ehr.medications.map((m) => `${m.name} (${m.status})`).join(", ")}
`;

  return `${ehrText}\n\nCRITERIA:\n${criteriaText}\n\nENCOUNTERS:\n${encountersText}`;
}

export async function extractEvidence(
  stay: Stay
): Promise<RawExtractionOutput> {
  const client = new Anthropic();

  const userMessage = buildUserMessage(stay, RUBRIC);

  const response = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "any" },
    messages: [{ role: "user", content: userMessage }],
  });

  // Find the tool use block
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUseBlock) {
    throw new Error("Model did not return a tool_use block");
  }

  const input = toolUseBlock.input as { results: RawResult[] };

  return {
    results: input.results,
    modelId: MODEL_ID,
  };
}
