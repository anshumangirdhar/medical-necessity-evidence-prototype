"use client";

import { CriterionResult, EvidenceItem } from "@/lib/types";
import { RUBRIC } from "@/lib/rubric";
import { StatusBadge } from "./StatusBadge";
import { EvidenceChip } from "./EvidenceChip";

interface CriterionRowProps {
  result: CriterionResult;
  activeItem: EvidenceItem | null;
  onEvidenceClick: (item: EvidenceItem) => void;
  encounterMap?: Record<string, string>;
}

export function CriterionRow({ result, activeItem, onEvidenceClick, encounterMap }: CriterionRowProps) {
  const criterion = RUBRIC.find((c) => c.id === result.criterionId);
  const hasGap = result.status !== "supported" && result.gap;
  const confidencePct = Math.round(result.confidence * 100);

  return (
    <div className={`border-b border-zinc-100 py-5 space-y-3 last:border-b-0 ${
      result.status === "not_supported" ? "opacity-90" : ""
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 leading-snug">
            {criterion?.name ?? result.criterionId}
          </h3>
          {criterion && (
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
              {criterion.locusDimension}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Confidence bar */}
          <div className="flex items-center gap-1.5" title={`Model confidence: ${confidencePct}%`}>
            <div className="w-14 h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  result.status === "supported" ? "bg-black" :
                  result.status === "partially_supported" ? "bg-zinc-400" : "bg-red-500"
                }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-300 font-mono tabular-nums">{confidencePct}%</span>
          </div>
          <StatusBadge status={result.status} />
        </div>
      </div>

      {(() => {
        const m = result.rationale.match(/^(.+?\.)(\s+[A-Z].+)?$/s);
        const finding = m ? m[1] : result.rationale;
        const note = m?.[2]?.trim() ?? null;
        return (
          <div className="space-y-1">
            <p className="text-sm text-zinc-800 font-medium leading-relaxed">{finding}</p>
            {note && <p className="text-xs text-zinc-500 leading-relaxed">{note}</p>}
          </div>
        );
      })()}

      {/* Evidence chips */}
      {result.evidence.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.evidence.map((item) => (
            <EvidenceChip
              key={`${item.encounterId}-${item.segmentId}`}
              item={item}
              encounterType={encounterMap?.[item.encounterId]}
              isActive={
                activeItem?.segmentId === item.segmentId &&
                activeItem?.encounterId === item.encounterId
              }
              onClick={onEvidenceClick}
            />
          ))}
        </div>
      )}

      {/* Gap callout */}
      {hasGap && (
        <div className="flex items-start gap-2 rounded bg-red-50 border border-red-100 px-3 py-2.5">
          <svg className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
          <p className="text-xs text-red-700 leading-relaxed">{result.gap}</p>
        </div>
      )}
    </div>
  );
}
