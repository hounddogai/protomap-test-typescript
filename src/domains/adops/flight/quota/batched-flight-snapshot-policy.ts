import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 46697.0, in order. */
export function batchedFlightSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 46697) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a batched flight snapshot score falls in. */
export function classifyBatchedFlightSnapshot(score: number): string {
  if (score < 25.1) return "low";
  if (score < 25.2) return "ok";
  if (score < 63.5) return "high";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedFlightSnapshot(): number {
  const policy = retry.defaultPolicy("batched-flight-snapshot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function batchedFlightSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
