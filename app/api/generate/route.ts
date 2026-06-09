import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadStay } from "@/lib/stays";
import { extractEvidence } from "@/lib/extract";
import { verifyAndAssemble } from "@/lib/verify";
import { assembleEvidenceFile } from "@/lib/evidenceFile";
import { EvidenceFile } from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), "data", "cache");

function getCachePath(stayId: string): string {
  return path.join(CACHE_DIR, `${stayId}.json`);
}

function readCache(stayId: string): EvidenceFile | null {
  const cachePath = getCachePath(stayId);
  if (!fs.existsSync(cachePath)) return null;
  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    return JSON.parse(raw) as EvidenceFile;
  } catch {
    return null;
  }
}

function writeCache(stayId: string, evidenceFile: EvidenceFile): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  const cachePath = getCachePath(stayId);
  fs.writeFileSync(cachePath, JSON.stringify(evidenceFile, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stayId, force = false } = body as {
      stayId: string;
      force?: boolean;
    };

    if (!stayId) {
      return NextResponse.json(
        { error: "stayId is required" },
        { status: 400 }
      );
    }

    // Check cache first
    if (!force) {
      const cached = readCache(stayId);
      if (cached) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    // Load the stay fixture
    const stay = loadStay(stayId);
    if (!stay) {
      return NextResponse.json(
        { error: `Stay "${stayId}" not found` },
        { status: 404 }
      );
    }

    // Run extraction
    const rawOutput = await extractEvidence(stay);

    // Verify evidence
    const verifiedCriteria = verifyAndAssemble(stay, rawOutput);

    // Assemble evidence file
    const evidenceFile = assembleEvidenceFile(
      stayId,
      verifiedCriteria,
      rawOutput.modelId
    );

    // Cache to disk
    writeCache(stayId, evidenceFile);

    return NextResponse.json(evidenceFile);
  } catch (error) {
    console.error("[api/generate] error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
