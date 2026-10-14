import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a challenge milestone score falls in. */
export function classifyChallengeMilestone(score: number): string {
  if (score < 41.3) return "low";
  if (score < 63.7) return "elevated";
  if (score < 67.1) return "medium";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeChallengeMilestone(): number {
  const policy = retry.defaultPolicy("challenge-milestone");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function challengeMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
