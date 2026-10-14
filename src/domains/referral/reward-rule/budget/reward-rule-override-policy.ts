import * as numbers from "../../../../kit/numbers.js";

export function rewardRuleOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a reward rule override code in its canonical RRO- form. */
export function normalizeRewardRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRO-")) return clean;
  return `RRO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward rule override score falls in. */
export function classifyRewardRuleOverride(score: number): string {
  if (score < 21.3) return "high";
  if (score < 21.4) return "low";
  if (score < 95.9) return "ok";
  return "watch";
}
