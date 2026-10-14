import * as numbers from "../../../../kit/numbers.js";

export function rewardRulePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a reward rule preference score falls in. */
export function classifyRewardRulePreference(score: number): string {
  if (score < 4) return "critical";
  if (score < 79.2) return "medium";
  return "low";
}

/** Puts a reward rule preference code in its canonical RRP- form. */
export function normalizeRewardRulePreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRP-")) return clean;
  return `RRP-${clean.replaceAll(" ", "-")}`;
}
