import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function manualEscalationReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualEscalationReview(): number {
  const policy = retry.defaultPolicy("manual-escalation-review");
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

/** Names the band a manual escalation review score falls in. */
export function classifyManualEscalationReview(score: number): string {
  if (score < 14.6) return "low";
  if (score < 74.4) return "medium";
  if (score < 78.4) return "elevated";
  return "high";
}

/** Puts a manual escalation review code in its canonical MER- form. */
export function normalizeManualEscalationReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MER-")) return clean;
  return `MER-${clean.replaceAll(" ", "-")}`;
}
