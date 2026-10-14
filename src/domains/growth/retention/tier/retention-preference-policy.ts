import * as numbers from "../../../../kit/numbers.js";

export function retentionPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a retention preference code in its canonical RP- form. */
export function normalizeRetentionPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

export function retentionPreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a retention preference score falls in. */
export function classifyRetentionPreference(score: number): string {
  if (score < 70.3) return "elevated";
  if (score < 92.4) return "low";
  return "ok";
}
