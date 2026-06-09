import { verifyAndAssemble } from "../lib/verify";
import { Stay } from "../lib/types";
import type { RawExtractionOutput } from "../lib/extract";

const MOCK_STAY: Stay = {
  id: "test-stay",
  label: "Test Stay",
  ehr: {
    stayId: "test-stay",
    patientPseudonym: "Patient X",
    admissionDate: "2026-01-01",
    dayOfStay: 3,
    primaryDx: "Test diagnosis",
    priorLevelsOfCare: [],
    medications: [],
  },
  encounters: [
    {
      id: "enc1",
      stayId: "test-stay",
      type: "admission",
      date: "2026-01-01",
      durationSec: 600,
      segments: [
        {
          id: "seg001",
          startSec: 10,
          speaker: "psychiatrist",
          text: "Are you having thoughts of hurting yourself right now?",
        },
        {
          id: "seg002",
          startSec: 25,
          speaker: "patient",
          text: "Yes. I still think it would be easier if I didn't wake up.",
        },
        {
          id: "seg003",
          startSec: 50,
          speaker: "nurse",
          text: "Patient will need close observation overnight.",
        },
      ],
    },
  ],
};

describe("verifyAndAssemble", () => {
  it("drops evidence with a fabricated quote not present in the segment", () => {
    const rawOutput: RawExtractionOutput = {
      results: [
        {
          criterionId: "risk_safety",
          status: "supported",
          evidence: [
            {
              segmentId: "seg002",
              quote: "I want to harm myself immediately.",
              speaker: "patient",
            },
          ],
          rationale: "Patient expressed suicidal ideation.",
          confidence: 0.9,
          gap: null,
        },
      ],
      modelId: "claude-sonnet-4-6",
    };

    const results = verifyAndAssemble(MOCK_STAY, rawOutput);
    const criterion = results.find((r) => r.criterionId === "risk_safety");

    expect(criterion).toBeDefined();
    expect(criterion!.evidence).toHaveLength(0);
    // Status should be downgraded to not_supported since all evidence dropped
    expect(criterion!.status).toBe("not_supported");
  });

  it("accepts a real verbatim quote from the transcript", () => {
    const rawOutput: RawExtractionOutput = {
      results: [
        {
          criterionId: "risk_safety",
          status: "supported",
          evidence: [
            {
              segmentId: "seg002",
              quote: "Yes. I still think it would be easier if I didn't wake up.",
              speaker: "patient",
            },
          ],
          rationale: "Patient endorsed passive suicidal ideation.",
          confidence: 0.95,
          gap: null,
        },
      ],
      modelId: "claude-sonnet-4-6",
    };

    const results = verifyAndAssemble(MOCK_STAY, rawOutput);
    const criterion = results.find((r) => r.criterionId === "risk_safety");

    expect(criterion).toBeDefined();
    expect(criterion!.evidence).toHaveLength(1);
    expect(criterion!.evidence[0].verified).toBe(true);
    expect(criterion!.evidence[0].timestampSec).toBe(25);
    expect(criterion!.evidence[0].speaker).toBe("patient");
    expect(criterion!.status).toBe("supported");
  });

  it("accepts a quote that is a case-insensitive substring of the segment", () => {
    const rawOutput: RawExtractionOutput = {
      results: [
        {
          criterionId: "risk_safety",
          status: "supported",
          evidence: [
            {
              segmentId: "seg002",
              quote: "yes. i still think it would be easier if i didn't wake up.",
              speaker: "patient",
            },
          ],
          rationale: "Patient endorsed suicidal ideation.",
          confidence: 0.9,
          gap: null,
        },
      ],
      modelId: "claude-sonnet-4-6",
    };

    const results = verifyAndAssemble(MOCK_STAY, rawOutput);
    const criterion = results.find((r) => r.criterionId === "risk_safety");

    expect(criterion!.evidence).toHaveLength(1);
    expect(criterion!.evidence[0].verified).toBe(true);
  });

  it("drops evidence referencing a non-existent segment ID", () => {
    const rawOutput: RawExtractionOutput = {
      results: [
        {
          criterionId: "risk_safety",
          status: "supported",
          evidence: [
            {
              segmentId: "seg999",
              quote: "Some text.",
              speaker: "patient",
            },
          ],
          rationale: "Referenced segment does not exist.",
          confidence: 0.8,
          gap: null,
        },
      ],
      modelId: "claude-sonnet-4-6",
    };

    const results = verifyAndAssemble(MOCK_STAY, rawOutput);
    const criterion = results.find((r) => r.criterionId === "risk_safety");

    expect(criterion!.evidence).toHaveLength(0);
    expect(criterion!.status).toBe("not_supported");
  });

  it("correctly fills encounterId and timestampSec from the real segment", () => {
    const rawOutput: RawExtractionOutput = {
      results: [
        {
          criterionId: "risk_safety",
          status: "supported",
          evidence: [
            {
              segmentId: "seg003",
              quote: "Patient will need close observation overnight.",
              speaker: "nurse",
            },
          ],
          rationale: "Nurse noted need for observation.",
          confidence: 0.85,
          gap: null,
        },
      ],
      modelId: "claude-sonnet-4-6",
    };

    const results = verifyAndAssemble(MOCK_STAY, rawOutput);
    const item = results[0].evidence[0];

    expect(item.encounterId).toBe("enc1");
    expect(item.segmentId).toBe("seg003");
    expect(item.timestampSec).toBe(50);
    expect(item.speaker).toBe("nurse");
    expect(item.verified).toBe(true);
  });
});
