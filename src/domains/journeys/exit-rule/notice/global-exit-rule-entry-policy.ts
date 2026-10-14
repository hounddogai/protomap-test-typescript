import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global exit rule entry score falls in. */
export function classifyGlobalExitRuleEntry(score: number): string {
  if (score < 59.6) return "high";
  if (score < 72.6) return "low";
  return "medium";
}

export function globalExitRuleEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
