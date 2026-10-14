import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeWeightedLeaderboardReservationLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedLeaderboardReservation(): number {
  const policy = retry.defaultPolicy("weighted-leaderboard-reservation");
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

export function weightedLeaderboardReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a weighted leaderboard reservation score falls in. */
export function classifyWeightedLeaderboardReservation(score: number): string {
  if (score < 8.7) return "low";
  if (score < 32.5) return "minimal";
  if (score < 95.1) return "watch";
  return "high";
}
