import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeQueueCheckpoint(): number {
  const policy = retry.defaultPolicy("queue-checkpoint");
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

/** Counts how many amounts fit in a budget of 19854.0, in order. */
export function queueCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 19854) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a queue checkpoint score falls in. */
export function classifyQueueCheckpoint(score: number): string {
  if (score < 42.8) return "elevated";
  if (score < 75.6) return "medium";
  if (score < 86.8) return "watch";
  return "critical";
}

export function mergeQueueCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
