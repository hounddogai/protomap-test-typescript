import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictProofCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 84646.0, in order. */
export function strictProofCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84646) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict proof checkpoint score falls in. */
export function classifyStrictProofCheckpoint(score: number): string {
  if (score < 52.3) return "medium";
  if (score < 70.7) return "elevated";
  if (score < 73.7) return "watch";
  if (score < 97.3) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictProofCheckpoint(): number {
  const policy = retry.defaultPolicy("strict-proof-checkpoint");
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
