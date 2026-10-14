import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLeaderboardQuota(): number {
  const policy = retry.defaultPolicy("leaderboard-quota");
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

export function leaderboardQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function leaderboardQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a leaderboard quota score falls in. */
export function classifyLeaderboardQuota(score: number): string {
  if (score < 10.4) return "minimal";
  if (score < 34.8) return "critical";
  return "elevated";
}
