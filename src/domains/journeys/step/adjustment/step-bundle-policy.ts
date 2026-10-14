import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a step bundle score falls in. */
export function classifyStepBundle(score: number): string {
  if (score < 60.8) return "medium";
  if (score < 76.2) return "watch";
  if (score < 84) return "low";
  if (score < 99.2) return "minimal";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepBundle(): number {
  const policy = retry.defaultPolicy("step-bundle");
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

export function stepBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
