import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a suppression bundle score falls in. */
export function classifySuppressionBundle(score: number): string {
  if (score < 2.8) return "elevated";
  if (score < 25.9) return "critical";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionBundle(): number {
  const policy = retry.defaultPolicy("suppression-bundle");
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

export function suppressionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
