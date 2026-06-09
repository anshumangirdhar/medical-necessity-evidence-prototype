"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EvidenceFile } from "@/lib/types";
import { RUBRIC } from "@/lib/rubric";

interface StayInfo {
  ehr: { patientPseudonym: string; primaryDx: string; admissionDate: string; dayOfStay: number; };
  encounters: { id: string; type: string; date: string; }[];
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); }
  catch { return iso; }
}

const ENCOUNTER_LABELS: Record<string, string> = {
  admission: "Admission", treatment_team: "Treatment Team",
  continued_stay_review: "Continued Stay Review", daily_check: "Daily Check",
};
const STATUS_LABELS: Record<string, string> = {
  supported: "SUPPORTED", partially_supported: "PARTIALLY SUPPORTED", not_supported: "NOT SUPPORTED",
};
const SPEAKER_LABELS: Record<string, string> = {
  psychiatrist: "Psychiatrist", nurse: "Nurse", social_worker: "Social Worker",
  patient: "Patient", care_team: "Care Team", other: "Other",
};

export default function PacketPage() {
  const params = useParams();
  const stayId = params.id as string;

  const [evidenceFile, setEvidenceFile] = useState<EvidenceFile | null>(null);
  const [stayInfo, setStayInfo] = useState<StayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [stayRes, efRes] = await Promise.all([
          fetch(`/api/stay/${stayId}`),
          fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stayId, force: false }),
          }),
        ]);
        if (!stayRes.ok) throw new Error("Failed to load stay");
        if (!efRes.ok) throw new Error("Failed to load evidence file");
        setStayInfo(await stayRes.json());
        setEvidenceFile(await efRes.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stayId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !evidenceFile || !stayInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600">{error ?? "No evidence file found."}</p>
          <Link href={`/stay/${stayId}`} className="text-xs text-black underline">Back to review</Link>
        </div>
      </div>
    );
  }

  const encounterMap = Object.fromEntries(stayInfo.encounters.map((e) => [e.id, e]));

  return (
    <div className="bg-white min-h-screen">
      {/* Print controls */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-zinc-100 px-6 py-3 flex items-center gap-4">
        <Link href={`/stay/${stayId}`} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 font-medium uppercase tracking-wide">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to review
        </Link>
        <button
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-1.5 rounded px-4 py-2 text-xs font-semibold bg-black text-white hover:bg-zinc-800 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Packet content */}
      <div className="max-w-2xl mx-auto px-8 py-10 space-y-8">
        {/* Cover block */}
        <div className="border border-zinc-900 p-6 print-break-inside-avoid">
          <div className="text-center mb-5 pb-5 border-b border-zinc-200">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">Medical Necessity Evidence Packet</p>
            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Continued Inpatient Psychiatric Stay</h1>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Patient</span><p className="text-zinc-900 mt-0.5">{stayInfo.ehr.patientPseudonym}</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Day of Stay</span><p className="text-zinc-900 mt-0.5">{stayInfo.ehr.dayOfStay}</p></div>
            <div className="col-span-2"><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Primary Diagnosis</span><p className="text-zinc-900 mt-0.5">{stayInfo.ehr.primaryDx}</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Admission Date</span><p className="text-zinc-900 mt-0.5">{formatDate(stayInfo.ehr.admissionDate)}</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Most Recent Encounter</span><p className="text-zinc-900 mt-0.5">{stayInfo.encounters.length > 0 ? formatDate(stayInfo.encounters[stayInfo.encounters.length - 1].date) : "—"}</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payer</span><p className="text-zinc-400 mt-0.5 italic">—</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Denial Basis</span><p className="text-zinc-400 mt-0.5 italic">—</p></div>
            <div><span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Generated</span><p className="text-zinc-900 mt-0.5">{formatDate(evidenceFile.generatedAt)}</p></div>
          </div>
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Summary</p>
            <div className="flex gap-6 text-sm">
              <span><strong className="text-zinc-900">{evidenceFile.summary.supportedCount}</strong> <span className="text-zinc-500">supported</span></span>
              <span><strong className="text-zinc-500">{evidenceFile.summary.partialCount}</strong> <span className="text-zinc-400">partial</span></span>
              <span><strong className="text-red-600">{evidenceFile.summary.gapCount}</strong> <span className="text-zinc-400">not supported</span></span>
            </div>
          </div>
        </div>

        {/* Criteria */}
        {evidenceFile.criteria.map((result) => {
          const criterion = RUBRIC.find((c) => c.id === result.criterionId);
          const statusLabel = STATUS_LABELS[result.status] ?? result.status.toUpperCase();
          const statusColor = result.status === "supported" ? "text-zinc-900" : result.status === "partially_supported" ? "text-zinc-500" : "text-red-600";
          const borderColor = result.status === "supported" ? "border-zinc-900" : result.status === "partially_supported" ? "border-zinc-300" : "border-red-500";

          return (
            <div key={result.criterionId} className={`border-l-2 ${borderColor} pl-4 space-y-2.5 print-break-inside-avoid`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">{criterion?.name ?? result.criterionId}</h2>
                  {criterion && <p className="text-[10px] text-zinc-400 uppercase tracking-wide mt-0.5">{criterion.locusDimension}</p>}
                </div>
                <span className={`text-[10px] font-bold ${statusColor} shrink-0 mt-0.5 uppercase tracking-wide`}>{statusLabel}</span>
              </div>

              {(() => {
                const m = result.rationale.match(/^(.+?\.)(\s+[A-Z].+)?$/s);
                const finding = m ? m[1] : result.rationale;
                const note = m?.[2]?.trim() ?? null;
                return (
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-800 font-medium leading-relaxed">{finding}</p>
                    {note && <p className="text-xs text-zinc-500 leading-relaxed">{note}</p>}
                  </div>
                );
              })()}

              {result.evidence.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">Evidence</p>
                  {result.evidence.map((item, idx) => {
                    const enc = encounterMap[item.encounterId];
                    const encLabel = enc ? `${ENCOUNTER_LABELS[enc.type] ?? enc.type}, ${enc.date}` : item.encounterId;
                    return (
                      <div key={idx} className="text-xs text-zinc-700 bg-zinc-50 rounded px-3 py-2 border border-zinc-100">
                        <span className="font-medium text-zinc-400">[{encLabel} · {formatTimestamp(item.timestampSec)} · {SPEAKER_LABELS[item.speaker] ?? item.speaker}]</span>{" "}
                        <span className="italic text-zinc-800">&ldquo;{item.quote}&rdquo;</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {result.gap && result.status !== "supported" && (
                <div className="rounded border border-red-100 bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-700">Gap: {result.gap}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Gaps summary */}
        {evidenceFile.summary.gaps.length > 0 && (
          <div className="border border-zinc-100 rounded p-5 space-y-3 print-break-inside-avoid">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Documentation Gaps</p>
            {evidenceFile.summary.gaps.map((g) => {
              const criterion = RUBRIC.find((c) => c.id === g.criterionId);
              return (
                <div key={g.criterionId}>
                  <span className="text-xs font-semibold text-zinc-800">{criterion?.name ?? g.criterionId}: </span>
                  <span className="text-xs text-zinc-500">{g.gap}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-100 pt-6 print-break-inside-avoid">
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Evidence assembled from the recorded encounters using AI ({evidenceFile.modelId}). Clinical determination and filing are made by the reviewing team. This document uses synthetic patient data only. No real patient information is contained herein.
          </p>
          <p className="text-[10px] text-zinc-400 mt-1.5">Generated: {new Date(evidenceFile.generatedAt).toISOString()}</p>
        </div>
      </div>
    </div>
  );
}
