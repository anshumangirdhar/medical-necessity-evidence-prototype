"use client";

import { useEffect, useRef, useState } from "react";
import { Encounter, EvidenceItem } from "@/lib/types";

interface TranscriptPaneProps {
  encounters: Encounter[];
  activeItem: EvidenceItem | null;
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SPEAKER_LABELS: Record<string, string> = {
  psychiatrist: "Psychiatrist",
  nurse: "Nurse",
  social_worker: "Social Worker",
  patient: "Patient",
  care_team: "Care Team",
  other: "Other",
};

const SPEAKER_COLORS: Record<string, string> = {
  psychiatrist: "text-zinc-900",
  nurse: "text-zinc-700",
  social_worker: "text-zinc-700",
  patient: "text-red-700",
  care_team: "text-zinc-700",
  other: "text-zinc-500",
};

const ENCOUNTER_TYPE_LABELS: Record<string, string> = {
  admission: "Admission",
  treatment_team: "Treatment Team",
  continued_stay_review: "Continued Stay Review",
  daily_check: "Daily Check",
};

function highlightSubstring(text: string, quote: string): React.ReactNode {
  if (!quote) return text;
  const normalized = quote.replace(/\s+/g, " ").trim();
  const idx = text.toLowerCase().indexOf(normalized.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-red-100 text-red-900 rounded-sm px-0.5 not-italic animate-highlight-in">
        {text.slice(idx, idx + normalized.length)}
      </mark>
      {text.slice(idx + normalized.length)}
    </>
  );
}

export function TranscriptPane({ encounters, activeItem }: TranscriptPaneProps) {
  const [activeEncounterId, setActiveEncounterId] = useState<string>(encounters[0]?.id ?? "");
  const segmentRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!activeItem) return;
    if (activeItem.encounterId !== activeEncounterId) {
      setActiveEncounterId(activeItem.encounterId);
      setTimeout(() => {
        segmentRefs.current.get(activeItem.segmentId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    } else {
      segmentRefs.current.get(activeItem.segmentId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeItem]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeEncounter = encounters.find((e) => e.id === activeEncounterId);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Encounter tabs */}
      <div className="border-b border-zinc-100 px-5 pt-4 bg-white shrink-0">
        <div className="flex gap-0 overflow-x-auto">
          {encounters.map((enc) => (
            <button
              key={enc.id}
              onClick={() => setActiveEncounterId(enc.id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                enc.id === activeEncounterId
                  ? "border-black text-black"
                  : "border-transparent text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <div className="font-semibold">{ENCOUNTER_TYPE_LABELS[enc.type] ?? enc.type}</div>
              <div className={`text-[10px] mt-0.5 font-mono ${enc.id === activeEncounterId ? "text-zinc-500" : "text-zinc-300"}`}>
                {enc.date}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Transcript scroll area */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-1 bg-white">
        {activeEncounter?.segments.map((seg) => {
          const isHighlighted =
            activeItem?.segmentId === seg.id &&
            activeItem?.encounterId === activeEncounterId;
          const speakerColor = SPEAKER_COLORS[seg.speaker] ?? "text-zinc-700";
          const speakerLabel = SPEAKER_LABELS[seg.speaker] ?? seg.speaker;

          return (
            <div
              key={seg.id}
              ref={(el) => {
                if (el) segmentRefs.current.set(seg.id, el);
                else segmentRefs.current.delete(seg.id);
              }}
              className={`rounded px-3 py-2.5 transition-all duration-200 ${
                isHighlighted
                  ? "bg-red-50 ring-1 ring-red-200"
                  : "hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-baseline gap-2.5 mb-0.5">
                <span className="text-[10px] font-mono text-zinc-300 tabular-nums shrink-0">
                  {formatTimestamp(seg.startSec)}
                </span>
                <span className={`text-xs font-semibold ${speakerColor}`}>
                  {speakerLabel}
                </span>
              </div>
              <p className={`text-sm leading-relaxed pl-8 ${isHighlighted ? "text-zinc-900" : "text-zinc-700"}`}>
                {isHighlighted && activeItem
                  ? highlightSubstring(seg.text, activeItem.quote)
                  : seg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
