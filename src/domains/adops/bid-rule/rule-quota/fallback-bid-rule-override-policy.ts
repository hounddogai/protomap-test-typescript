import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a fallback bid rule override code in its canonical FBRO- form. */
export function normalizeFallbackBidRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBRO-")) return clean;
  return `FBRO-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback bid rule override score falls in. */
export function classifyFallbackBidRuleOverride(score: number): string {
  if (score < 22.3) return "ok";
  if (score < 50.1) return "elevated";
  if (score < 93.6) return "low";
  if (score < 94.9) return "high";
  return "critical";
}

export function mergeFallbackBidRuleOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackBidRuleOverride(): number {
  const policy = retry.defaultPolicy("fallback-bid-rule-override");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
