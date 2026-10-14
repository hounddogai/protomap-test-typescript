import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveLeaderboardBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptiveLeaderboardBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveLeaderboardBaseline(): number {
  const policy = retry.defaultPolicy("adaptive-leaderboard-baseline");
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
