import { Stay, CriterionResult, EvidenceItem, CriterionStatus } from "./types";
import { RawExtractionOutput } from "./extract";

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function isSubstringCI(quote: string, segmentText: string): boolean {
  const normalizedQuote = normalizeWhitespace(quote).toLowerCase();
  const normalizedText = normalizeWhitespace(segmentText).toLowerCase();
  return normalizedText.includes(normalizedQuote);
}

/** Build a flat map: segmentId -> { segment, encounterId } */
function buildSegmentIndex(stay: Stay): Map<
  string,
  {
    id: string;
    startSec: number;
    speaker: string;
    text: string;
    encounterId: string;
  }
> {
  const index = new Map<
    string,
    {
      id: string;
      startSec: number;
      speaker: string;
      text: string;
      encounterId: string;
    }
  >();
  for (const encounter of stay.encounters) {
    for (const seg of encounter.segments) {
      index.set(seg.id, {
        id: seg.id,
        startSec: seg.startSec,
        speaker: seg.speaker,
        text: seg.text,
        encounterId: encounter.id,
      });
    }
  }
  return index;
}

export function verifyAndAssemble(
  stay: Stay,
  raw: RawExtractionOutput
): CriterionResult[] {
  const segmentIndex = buildSegmentIndex(stay);
  const isDev = process.env.NODE_ENV === "development";

  const results: CriterionResult[] = raw.results.map((rawResult) => {
    const verifiedEvidence: EvidenceItem[] = [];

    for (const item of rawResult.evidence) {
      const seg = segmentIndex.get(item.segmentId);

      if (!seg) {
        if (isDev) {
          console.warn(
            `[verify] DROP: segmentId "${item.segmentId}" not found in stay "${stay.id}"`
          );
        }
        continue;
      }

      if (!isSubstringCI(item.quote, seg.text)) {
        if (isDev) {
          console.warn(
            `[verify] DROP: quote not found in segment "${item.segmentId}"\n  quote: "${item.quote}"\n  text:  "${seg.text}"`
          );
        }
        continue;
      }

      verifiedEvidence.push({
        encounterId: seg.encounterId,
        segmentId: seg.id,
        timestampSec: seg.startSec,
        speaker: seg.speaker as EvidenceItem["speaker"],
        quote: item.quote,
        verified: true,
      });
    }

    // Recompute status based on verified evidence only
    let status: CriterionStatus = rawResult.status as CriterionStatus;
    let gap: string | undefined = rawResult.gap ?? undefined;

    if (verifiedEvidence.length === 0) {
      status = "not_supported";
      if (!gap) {
        gap = `No verifiable transcript evidence was found for this criterion.`;
      }
    } else if (
      rawResult.status === "supported" &&
      verifiedEvidence.length < rawResult.evidence.length
    ) {
      // Some evidence was dropped; downgrade if we lost most of it
      const retentionRate =
        verifiedEvidence.length / rawResult.evidence.length;
      if (retentionRate < 0.5) {
        status = "partially_supported";
        gap =
          gap ??
          "Some cited evidence could not be verified verbatim in the transcript.";
      }
    }

    return {
      criterionId: rawResult.criterionId,
      status,
      evidence: verifiedEvidence,
      rationale: rawResult.rationale,
      confidence: rawResult.confidence,
      gap,
    };
  });

  return results;
}
