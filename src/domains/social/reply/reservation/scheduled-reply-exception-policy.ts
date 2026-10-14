import * as numbers from "../../../../kit/numbers.js";

export function scheduledReplyExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a scheduled reply exception code in its canonical SRE- form. */
export function normalizeScheduledReplyExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRE-")) return clean;
  return `SRE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a scheduled reply exception score falls in. */
export function classifyScheduledReplyException(score: number): string {
  if (score < 28.9) return "critical";
  if (score < 64.4) return "elevated";
  if (score < 69.3) return "low";
  if (score < 94.8) return "medium";
  return "high";
}

export function scheduledReplyExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
