import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled nudge profile score falls in. */
export function classifyScheduledNudgeProfile(score: number): string {
  if (score < 34.6) return "minimal";
  if (score < 67.4) return "medium";
  return "elevated";
}

/** Puts a scheduled nudge profile code in its canonical SNP- form. */
export function normalizeScheduledNudgeProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SNP-")) return clean;
  return `SNP-${clean.replaceAll(" ", "-")}`;
}

export function scheduledNudgeProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
