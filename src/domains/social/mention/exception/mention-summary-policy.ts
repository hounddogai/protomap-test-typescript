import * as numbers from "../../../../kit/numbers.js";

/** Puts a mention summary code in its canonical MS- form. */
export function normalizeMentionSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MS-")) return clean;
  return `MS-${clean.replaceAll(" ", "-")}`;
}

export function mentionSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a mention summary score falls in. */
export function classifyMentionSummary(score: number): string {
  if (score < 27.1) return "low";
  if (score < 43.3) return "high";
  return "medium";
}
