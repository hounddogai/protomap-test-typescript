import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackSlaSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackSlaSummary(): number {
  const policy = retry.defaultPolicy("fallback-sla-summary");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a fallback sla summary code in its canonical FSS- form. */
export function normalizeFallbackSlaSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FSS-")) return clean;
  return `FSS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a fallback sla summary score falls in. */
export function classifyFallbackSlaSummary(score: number): string {
  if (score < 11.1) return "high";
  if (score < 22.3) return "critical";
  if (score < 76) return "elevated";
  if (score < 80.2) return "minimal";
  return "low";
}
