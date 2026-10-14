import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLeaderboardBatch(): number {
  const policy = retry.defaultPolicy("leaderboard-batch");
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

export function mergeLeaderboardBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 54235.0, in order. */
export function leaderboardBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54235) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a leaderboard batch score falls in. */
export function classifyLeaderboardBatch(score: number): string {
  if (score < 23.9) return "minimal";
  if (score < 75) return "elevated";
  return "watch";
}
