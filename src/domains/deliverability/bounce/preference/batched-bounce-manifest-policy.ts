import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched bounce manifest score falls in. */
export function classifyBatchedBounceManifest(score: number): string {
  if (score < 11.4) return "minimal";
  if (score < 53.4) return "medium";
  if (score < 56.9) return "ok";
  if (score < 78.7) return "elevated";
  return "critical";
}

export function mergeBatchedBounceManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 18779.0, in order. */
export function batchedBounceManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18779) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedBounceManifest(): number {
  const policy = retry.defaultPolicy("batched-bounce-manifest");
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
