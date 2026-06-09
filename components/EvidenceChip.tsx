"use client";

import { EvidenceItem } from "@/lib/types";

"use client";

import { EvidenceItem } from "@/lib/types";

interface EvidenceChipProps {
  item: EvidenceItem;
  isActive?: boolean;
  onClick: (item: EvidenceItem) => void;
  encounterType?: string;
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SPEAKER_LABELS: Record<string, string> = {
  psychiatrist: "MD",
  nurse: "RN",
  social_worker: "SW",
  patient: "Pt",
  care_team: "Team",
  other: "—",
};

const ENCOUNTER_ABBR: Record<string, string> = {
  admission: "ADM",
  treatment_team: "TT",
  continued_stay_review: "CSR",
  daily_check: "DC",
};

export function EvidenceChip({ item, isActive, onClick, encounterType }: EvidenceChipProps) {
  const speakerLabel = SPEAKER_LABELS[item.speaker] ?? item.speaker;
  const timestamp = formatTimestamp(item.timestampSec);
  const encAbbr = encounterType ? (ENCOUNTER_ABBR[encounterType] ?? encounterType.toUpperCase()) : null;
  const truncatedQuote = item.quote.length > 56 ? item.quote.slice(0, 53) + "…" : item.quote;

  return (
    <button
      onClick={() => onClick(item)}
      title={item.quote}
      className={`
        inline-flex items-center rounded px-2.5 py-1.5
        text-xs font-mono font-semibold transition-colors duration-100 cursor-pointer border
        ${isActive
          ? "bg-red-600 border-red-600 text-red-100"
          : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:bg-zinc-100 hover:border-zinc-300 hover:text-zinc-600"
        }
      `}
    >
      {encAbbr && <>{encAbbr} · </>}{speakerLabel} {timestamp}
    </button>
  );
}
