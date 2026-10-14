import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled frequency claim code in its canonical SFC- form. */
export function normalizeScheduledFrequencyClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFC-")) return clean;
  return `SFC-${clean.replaceAll(" ", "-")}`;
}

export function scheduledFrequencyClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a scheduled frequency claim score falls in. */
export function classifyScheduledFrequencyClaim(score: number): string {
  if (score < 43.8) return "minimal";
  if (score < 87.5) return "critical";
  if (score < 89.8) return "medium";
  return "low";
}
