import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeFallbackJourneyReviewLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a fallback journey review score falls in. */
export function classifyFallbackJourneyReview(score: number): string {
  if (score < 8.9) return "minimal";
  if (score < 44.4) return "low";
  if (score < 57.1) return "elevated";
  if (score < 90.3) return "watch";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackJourneyReview(): number {
  const policy = retry.defaultPolicy("fallback-journey-review");
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

/** Puts a fallback journey review code in its canonical FJR- form. */
export function normalizeFallbackJourneyReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FJR-")) return clean;
  return `FJR-${clean.replaceAll(" ", "-")}`;
}
