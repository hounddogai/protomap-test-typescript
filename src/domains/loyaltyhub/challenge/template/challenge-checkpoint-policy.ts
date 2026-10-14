import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a challenge checkpoint score falls in. */
export function classifyChallengeCheckpoint(score: number): string {
  if (score < 36.9) return "critical";
  if (score < 45.4) return "high";
  if (score < 45.8) return "ok";
  if (score < 50.8) return "low";
  return "minimal";
}

export function challengeCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function challengeCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeChallengeCheckpoint(): number {
  const policy = retry.defaultPolicy("challenge-checkpoint");
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
