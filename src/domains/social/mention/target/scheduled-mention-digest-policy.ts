import * as numbers from "../../../../kit/numbers.js";

/** Names the band a scheduled mention digest score falls in. */
export function classifyScheduledMentionDigest(score: number): string {
  if (score < 15.7) return "ok";
  if (score < 36.3) return "high";
  if (score < 59.3) return "low";
  return "critical";
}

export function scheduledMentionDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a scheduled mention digest code in its canonical SMD- form. */
export function normalizeScheduledMentionDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SMD-")) return clean;
  return `SMD-${clean.replaceAll(" ", "-")}`;
}
