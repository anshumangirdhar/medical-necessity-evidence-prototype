import { EvidenceFile } from "@/lib/types";
import { RUBRIC } from "@/lib/rubric";

interface GapsSectionProps {
  evidenceFile: EvidenceFile;
}

export function GapsSection({ evidenceFile }: GapsSectionProps) {
  const { gaps } = evidenceFile.summary;

  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded bg-zinc-50 border border-zinc-100 px-4 py-3">
        <svg className="h-4 w-4 text-black shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <p className="text-sm text-zinc-600">No documentation gaps. All criteria are supported.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Documentation Gaps</span>
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold">{gaps.length}</span>
      </div>
      {gaps.map((g) => {
        const criterion = RUBRIC.find((c) => c.id === g.criterionId);
        const isNotSupported = evidenceFile.criteria.find((c) => c.criterionId === g.criterionId)?.status === "not_supported";

        return (
          <div key={g.criterionId} className={`rounded border px-4 py-3 space-y-1 ${
            isNotSupported ? "border-red-200 bg-red-50" : "border-zinc-200 bg-zinc-50"
          }`}>
            <p className={`text-xs font-semibold ${isNotSupported ? "text-red-900" : "text-zinc-800"}`}>
              {criterion?.name ?? g.criterionId}
            </p>
            <p className={`text-xs leading-relaxed ${isNotSupported ? "text-red-700" : "text-zinc-600"}`}>
              {g.gap}
            </p>
          </div>
        );
      })}
    </div>
  );
}
