"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { EvidenceFile, EvidenceItem } from "@/lib/types";
import { CriterionRow } from "@/components/CriterionRow";
import { TranscriptPane } from "@/components/TranscriptPane";
import { GapsSection } from "@/components/GapsSection";

interface StayData {
  stay: {
    id: string;
    label: string;
    ehr: {
      patientPseudonym: string;
      primaryDx: string;
      admissionDate: string;
      dayOfStay: number;
    };
    encounters: {
      id: string;
      stayId: string;
      type: string;
      date: string;
      durationSec: number;
      segments: {
        id: string;
        startSec: number;
        speaker: string;
        text: string;
      }[];
    }[];
  };
  evidenceFile: EvidenceFile | null;
}

type LoadState = "idle" | "loading" | "generating" | "done" | "error";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

export default function StayPage() {
  const params = useParams();
  const stayId = params.id as string;

  const [data, setData] = useState<StayData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<EvidenceItem | null>(null);
  const [showApiNotice, setShowApiNotice] = useState(false);

  const fetchStay = useCallback(async () => {
    setLoadState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/stay/${stayId}`);
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load stay");
      setData({ stay: await res.json(), evidenceFile: null });
      setLoadState("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoadState("error");
    }
  }, [stayId]);

  const generateEvidence = useCallback(async (force = false) => {
    if (!data) return;
    setLoadState("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stayId, force }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      const ef: EvidenceFile = await res.json();
      setData((prev) => prev ? { ...prev, evidenceFile: ef } : prev);
      setLoadState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoadState("error");
    }
  }, [data, stayId]);

  useEffect(() => { fetchStay(); }, [fetchStay]);

  useEffect(() => {
    if (loadState === "idle" && data && !data.evidenceFile) {
      generateEvidence(false);
    }
  }, [loadState, data, generateEvidence]);

  const handleEvidenceClick = useCallback((item: EvidenceItem) => {
    setActiveItem((prev) =>
      prev?.segmentId === item.segmentId && prev?.encounterId === item.encounterId ? null : item
    );
  }, []);

  if (loadState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-600">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 underline">Back</Link>
            <button onClick={() => { setLoadState("idle"); fetchStay(); }} className="text-sm text-black underline">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 uppercase tracking-widest">Loading</p>
        </div>
      </div>
    );
  }

  const { stay, evidenceFile } = data;
  const isGenerating = loadState === "generating";
  const { supportedCount, partialCount, gapCount } = evidenceFile?.summary ?? { supportedCount: 0, partialCount: 0, gapCount: 0 };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-zinc-100 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3 px-5 h-12">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors font-medium uppercase tracking-wide">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Reviews
          </Link>
          <span className="text-zinc-200">/</span>
          <span className="text-xs font-semibold text-zinc-800">{stay.label}</span>

          <div className="ml-auto flex items-center gap-2">
            {evidenceFile && (
              <Link
                href={`/stay/${stayId}/packet`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded px-3 py-1.5 hover:bg-zinc-50 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Export packet
              </Link>
            )}
            <button
              onClick={() => { setShowApiNotice(true); setTimeout(() => setShowApiNotice(false), 4000); }}
              className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold bg-black text-white hover:bg-zinc-800 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </header>

      {/* API notice banner */}
      {showApiNotice && (
        <div className="shrink-0 bg-zinc-50 border-b border-zinc-100 px-5 py-2 flex items-center justify-between">
          <p className="text-[11px] text-zinc-500">API not connected — pre-cached results shown.</p>
          <button onClick={() => setShowApiNotice(false)} className="text-[11px] text-zinc-300 hover:text-zinc-500">Dismiss</button>
        </div>
      )}

      {/* Two-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE — evidence file, dark-ish */}
        <div className="w-[52%] flex flex-col border-r border-zinc-100 overflow-hidden bg-white">
          <div className="overflow-y-auto flex-1 px-6 py-6">

            {/* Patient header */}
            <div className="mb-5 pb-5 border-b border-zinc-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 tracking-tight">{stay.ehr.patientPseudonym}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{stay.ehr.primaryDx}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 font-medium uppercase tracking-wide">
                    Inpatient · Day {stay.ehr.dayOfStay} · Admitted {formatDate(stay.ehr.admissionDate)}
                  </p>
                  {stay.encounters.length > 0 && (
                    <p className="text-[11px] text-zinc-300 mt-0.5 font-medium uppercase tracking-wide">
                      Last encounter: {formatDate(stay.encounters[stay.encounters.length - 1].date)}
                    </p>
                  )}
                </div>
                {/* Mini summary pills */}
                {evidenceFile && (
                  <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                    {gapCount > 0 ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
                          Incomplete
                        </span>
                        <span className="text-[10px] text-zinc-400">{supportedCount}/{evidenceFile.criteria.length} supported · {gapCount} gap{gapCount !== 1 ? "s" : ""}</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-zinc-900">{supportedCount}/{evidenceFile.criteria.length}</span>
                          <span className="text-[10px] text-zinc-400 uppercase tracking-wide">supported</span>
                        </div>
                        {partialCount > 0 && (
                          <span className="text-[10px] text-zinc-400">{partialCount} partial</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Generating state */}
            {isGenerating && (
              <div className="flex items-center gap-3 rounded border border-zinc-100 bg-zinc-50 px-4 py-4 mb-5">
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-zinc-900">Analyzing transcripts</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Reviewing encounters against five continued-stay criteria…</p>
                </div>
              </div>
            )}

            {/* Criteria list */}
            {evidenceFile && (
              <>
                {/* Gaps section — shown first when gaps exist */}
                {evidenceFile.summary.gaps.length > 0 && (
                  <div className="mb-6 pb-5 border-b border-zinc-100">
                    <GapsSection evidenceFile={evidenceFile} />
                  </div>
                )}

                <div className="mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300">Criteria Assessment</span>
                </div>
                <div>
                  {evidenceFile.criteria.map((result) => (
                    <CriterionRow
                      key={result.criterionId}
                      result={result}
                      activeItem={activeItem}
                      onEvidenceClick={handleEvidenceClick}
                      encounterMap={Object.fromEntries(stay.encounters.map((e) => [e.id, e.type]))}
                    />
                  ))}
                </div>

                {/* Footer */}
                <p className="mt-8 text-[10px] text-zinc-300 leading-relaxed border-t border-zinc-50 pt-4">
                  Evidence assembled from recorded encounters ({evidenceFile.modelId}). This tool identifies and links transcript evidence — it does not determine medical necessity. All clinical determinations are made by the reviewing team.
                </p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANE — transcript */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {stay.encounters.length > 0 ? (
            <TranscriptPane
              encounters={stay.encounters as Parameters<typeof TranscriptPane>[0]["encounters"]}
              activeItem={activeItem}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-zinc-300 uppercase tracking-wide">No encounters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
