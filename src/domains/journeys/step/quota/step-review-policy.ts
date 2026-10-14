import * as retry from "../../../../kit/retry.js";

/** Puts a step review code in its canonical SR- form. */
export function normalizeStepReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SR-")) return clean;
  return `SR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepReview(): number {
  const policy = retry.defaultPolicy("step-review");
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

/** Names the band a step review score falls in. */
export function classifyStepReview(score: number): string {
  if (score < 23.1) return "high";
  if (score < 58.1) return "ok";
  if (score < 60.5) return "critical";
  if (score < 89.4) return "minimal";
  return "watch";
}
