import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted mention cycle code in its canonical WMC- form. */
export function normalizeWeightedMentionCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WMC-")) return clean;
  return `WMC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a weighted mention cycle score falls in. */
export function classifyWeightedMentionCycle(score: number): string {
  if (score < 20.2) return "low";
  if (score < 34.7) return "watch";
  if (score < 35.1) return "minimal";
  if (score < 77.3) return "critical";
  return "ok";
}

export function weightedMentionCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
