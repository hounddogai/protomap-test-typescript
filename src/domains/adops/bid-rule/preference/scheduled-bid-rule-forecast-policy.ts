import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a scheduled bid rule forecast code in its canonical SBRF- form. */
export function normalizeScheduledBidRuleForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SBRF-")) return clean;
  return `SBRF-${clean.replaceAll(" ", "-")}`;
}

export function mergeScheduledBidRuleForecastLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledBidRuleForecast(): number {
  const policy = retry.defaultPolicy("scheduled-bid-rule-forecast");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a scheduled bid rule forecast score falls in. */
export function classifyScheduledBidRuleForecast(score: number): string {
  if (score < 89.7) return "ok";
  if (score < 92.8) return "high";
  return "watch";
}
