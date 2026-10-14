import * as numbers from "../../../../kit/numbers.js";

export function rewardRuleEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a reward rule entry score falls in. */
export function classifyRewardRuleEntry(score: number): string {
  if (score < 5.8) return "medium";
  if (score < 38.7) return "high";
  if (score < 83.2) return "watch";
  return "low";
}

/** Puts a reward rule entry code in its canonical RRE- form. */
export function normalizeRewardRuleEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRE-")) return clean;
  return `RRE-${clean.replaceAll(" ", "-")}`;
}
