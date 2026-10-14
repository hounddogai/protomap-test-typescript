import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending proof mapping code in its canonical PPM- form. */
export function normalizePendingProofMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPM-")) return clean;
  return `PPM-${clean.replaceAll(" ", "-")}`;
}

export function pendingProofMappingBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a pending proof mapping score falls in. */
export function classifyPendingProofMapping(score: number): string {
  if (score < 1.8) return "ok";
  if (score < 23.2) return "critical";
  if (score < 35.8) return "low";
  return "elevated";
}

export function pendingProofMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
