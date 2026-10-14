import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive mention allocation score falls in. */
export function classifyAdaptiveMentionAllocation(score: number): string {
  if (score < 59.1) return "high";
  if (score < 79.3) return "ok";
  if (score < 87) return "medium";
  return "minimal";
}

export function adaptiveMentionAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a adaptive mention allocation code in its canonical AMA- form. */
export function normalizeAdaptiveMentionAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMA-")) return clean;
  return `AMA-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveMentionAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
