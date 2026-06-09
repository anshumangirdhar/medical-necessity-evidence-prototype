import { Criterion } from "./types";

export const RUBRIC: Criterion[] = [
  {
    id: "risk_safety",
    name: "Acute risk and safety",
    locusDimension: "Risk of harm",
    definition:
      "Current danger to self or others, or inability to maintain safety, that requires a 24-hour supervised setting.",
    positiveIndicators: [
      "current suicidal or homicidal ideation with plan or intent",
      "recent attempt or self-harm during the stay",
      "command hallucinations directing harm",
      "unable to contract for safety",
      "requires 1:1 or line-of-sight observation",
    ],
    negativeIndicators: [
      "denies current ideation",
      "future-oriented, makes plans",
      "safety plan in place and endorsed",
      "no recent incidents",
    ],
    required: true,
  },
  {
    id: "functional_impairment",
    name: "Functional impairment",
    locusDimension: "Functional status",
    definition:
      "Impairment in current functioning (self-care, reality testing, behavioral control) at a level a lower setting cannot manage.",
    positiveIndicators: [
      "not eating or sleeping",
      "disorganized thought or behavior",
      "needs prompting or assistance for basic self-care",
      "behavioral dyscontrol requiring staff intervention",
    ],
    negativeIndicators: [
      "managing daily activities independently",
      "oriented and coherent",
      "participating in groups and milieu",
    ],
    required: true,
  },
  {
    id: "deterioration_risk",
    name: "Likelihood of deterioration at a lower level of care",
    locusDimension: "Recovery environment and level of support",
    definition:
      "Specific reasons a less intensive setting would likely fail for this patient right now.",
    positiveIndicators: [
      "unstable or unsafe home environment",
      "absent or unable support system",
      "rapid decompensation the last time care stepped down",
      "active medication titration needing inpatient monitoring",
    ],
    negativeIndicators: [
      "stable, supportive home",
      "can be safely managed in PHP or outpatient",
      "reliable outpatient follow-up arranged",
    ],
    required: true,
  },
  {
    id: "treatment_response",
    name: "Response to treatment and continued need",
    locusDimension: "Treatment progress",
    definition:
      "Whether the patient is responding, and if so why continued inpatient care is still required, or if not, what is being changed.",
    positiveIndicators: [
      "medication actively being titrated under monitoring",
      "partial response with persistent acute symptoms",
      "active changes to the treatment plan",
    ],
    negativeIndicators: [
      "stable on current regimen",
      "in active discharge planning",
      "no changes to plan in recent days",
    ],
    required: true,
  },
  {
    id: "less_restrictive_tried",
    name: "Less restrictive alternatives",
    locusDimension: "Treatment and recovery history; engagement",
    definition:
      "Whether lower levels of care were tried or considered, and why they are inappropriate now.",
    positiveIndicators: [
      "recently failed PHP or IOP",
      "left a lower level of care against advice",
      "explicit discussion of why step-down is premature",
    ],
    negativeIndicators: [
      "alternatives never discussed in the conversation",
      "never tried a lower level despite current stability",
    ],
    required: true,
  },
];
