import { CriterionResult, EvidenceFile } from "./types";
import { RUBRIC } from "./rubric";

export function assembleEvidenceFile(
  stayId: string,
  criteria: CriterionResult[],
  modelId: string
): EvidenceFile {
  // Reorder criteria to match canonical rubric order
  const rubricOrder = RUBRIC.map((c) => c.id);
  const orderedCriteria = rubricOrder
    .map((id) => criteria.find((c) => c.criterionId === id))
    .filter((c): c is CriterionResult => c !== undefined);

  // Append any extra criteria not in rubric at the end
  for (const c of criteria) {
    if (!rubricOrder.includes(c.criterionId)) {
      orderedCriteria.push(c);
    }
  }

  const supportedCount = orderedCriteria.filter(
    (c) => c.status === "supported"
  ).length;
  const partialCount = orderedCriteria.filter(
    (c) => c.status === "partially_supported"
  ).length;
  const gapCount = orderedCriteria.filter(
    (c) => c.status === "not_supported"
  ).length;

  const gaps = orderedCriteria
    .filter((c) => c.status !== "supported" && c.gap)
    .map((c) => ({ criterionId: c.criterionId, gap: c.gap! }));

  return {
    stayId,
    generatedAt: new Date().toISOString(),
    modelId,
    criteria: orderedCriteria,
    summary: {
      supportedCount,
      partialCount,
      gapCount,
      gaps,
    },
  };
}
