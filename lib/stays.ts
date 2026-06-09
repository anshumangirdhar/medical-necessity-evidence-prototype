import fs from "fs";
import path from "path";
import { Stay } from "./types";

const FIXTURES_DIR = path.join(process.cwd(), "data", "fixtures");

const FIXTURE_FILES = [
  "stay-gaps.json",
  "stay-supported.json",
  "stay-borderline.json",
];

export function loadStay(stayId: string): Stay | null {
  for (const filename of FIXTURE_FILES) {
    const filePath = path.join(FIXTURES_DIR, filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const stay = JSON.parse(raw) as Stay;
      if (stay.id === stayId) return stay;
    } catch {
      // skip malformed
    }
  }
  return null;
}

export function loadAllStays(): Stay[] {
  const stays: Stay[] = [];
  for (const filename of FIXTURE_FILES) {
    const filePath = path.join(FIXTURES_DIR, filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      stays.push(JSON.parse(raw) as Stay);
    } catch {
      // skip malformed
    }
  }
  return stays;
}

export function stayFileExists(stayId: string): boolean {
  return loadStay(stayId) !== null;
}
