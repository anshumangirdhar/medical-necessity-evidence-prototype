export type Speaker =
  | "psychiatrist"
  | "nurse"
  | "social_worker"
  | "patient"
  | "care_team"
  | "other";

export interface TranscriptSegment {
  id: string;
  startSec: number;
  speaker: Speaker;
  text: string;
}

export interface Encounter {
  id: string;
  stayId: string;
  type:
    | "admission"
    | "treatment_team"
    | "continued_stay_review"
    | "daily_check";
  date: string;
  durationSec: number;
  segments: TranscriptSegment[];
}

export interface PriorLevelOfCare {
  setting: string;
  date: string;
  outcome: string;
}

export interface EhrRecord {
  stayId: string;
  patientPseudonym: string;
  admissionDate: string;
  dayOfStay: number;
  primaryDx: string;
  priorLevelsOfCare: PriorLevelOfCare[];
  medications: {
    name: string;
    status: "started" | "titrating" | "stable" | "discontinued";
  }[];
}

export interface Stay {
  id: string;
  label: string;
  ehr: EhrRecord;
  encounters: Encounter[];
}

export interface Criterion {
  id: string;
  name: string;
  locusDimension: string;
  definition: string;
  positiveIndicators: string[];
  negativeIndicators: string[];
  required: true;
}

export type CriterionStatus =
  | "supported"
  | "partially_supported"
  | "not_supported";

export interface EvidenceItem {
  encounterId: string;
  segmentId: string;
  timestampSec: number;
  speaker: Speaker;
  quote: string;
  verified: boolean;
}

export interface CriterionResult {
  criterionId: string;
  status: CriterionStatus;
  evidence: EvidenceItem[];
  rationale: string;
  confidence: number;
  gap?: string;
}

export interface EvidenceFile {
  stayId: string;
  generatedAt: string;
  modelId: string;
  criteria: CriterionResult[];
  summary: {
    supportedCount: number;
    partialCount: number;
    gapCount: number;
    gaps: { criterionId: string; gap: string }[];
  };
}
