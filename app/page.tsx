import fs from "fs";
import path from "path";
import Link from "next/link";
import { loadAllStays } from "@/lib/stays";
import { Stay } from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");

function isCached(stayId: string): boolean {
  return fs.existsSync(path.join(CACHE_DIR, `${stayId}.json`));
}

const STAY_DESCRIPTIONS: Record<string, string> = {
  "stay-gaps": "MDD with psychotic features, day 5. Four criteria supported; less-restrictive alternatives never discussed in any encounter. One documentation gap that could sink an appeal.",
  "stay-supported": "Bipolar I, mixed features, day 4. Active suicidal ideation with plan, 1:1 observation, recent PHP failure, medications mid-titration. All five criteria clearly evidenced.",
  "stay-borderline": "GAD with depression, day 7. Patient future-oriented, stable, supportive home. File honestly surfaces a weak continued-stay case — zero criteria supported. The integrity story.",
};

export default function HomePage() {
  let stays: Stay[] = [];
  try { stays = loadAllStays(); } catch { /* empty */ }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center gap-3">
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-black rounded-sm flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900">Medical Necessity</span>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300">Prototype · Synthetic data only</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Page headline */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Inpatient psychiatric stay reviews</h1>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-xl">
            Select a synthetic stay. The AI analyzes transcripts against five continued-stay criteria, links every finding to the exact conversation moment, and surfaces documentation gaps.
          </p>
        </div>

        {/* Stay list */}
        <div className="space-y-px border border-zinc-100 rounded-lg overflow-hidden">
          {stays.map((stay, i) => {
            const cached = isCached(stay.id);
            const description = STAY_DESCRIPTIONS[stay.id] ?? `${stay.ehr.primaryDx}. Day ${stay.ehr.dayOfStay}.`;

            return (
              <div key={stay.id} className={`bg-white px-5 py-4 flex items-start gap-4 group hover:bg-zinc-50 transition-colors ${i < stays.length - 1 ? "border-b border-zinc-100" : ""}`}>
                {/* Index */}
                <span className="text-xs font-mono text-zinc-200 mt-0.5 w-4 shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-sm font-semibold text-zinc-900">{stay.label}</h2>
                    {cached && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 border border-zinc-200 rounded-sm px-1.5 py-0.5">Cached</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mb-1 font-medium">{stay.ehr.patientPseudonym} · {stay.ehr.primaryDx} · Day {stay.ehr.dayOfStay}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
                </div>

                <Link
                  href={`/stay/${stay.id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-semibold bg-black text-white hover:bg-zinc-800 transition-colors"
                >
                  Open
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            );
          })}

          {stays.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-zinc-400">No fixture files found in <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">data/fixtures/</code></p>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-xs text-zinc-300 leading-relaxed">
          This prototype uses synthetic patient data only. No real patient information is processed or stored. Evidence is assembled by AI from recorded transcripts; all clinical and coverage determinations are made by the reviewing team.
        </p>
      </div>
    </div>
  );
}
