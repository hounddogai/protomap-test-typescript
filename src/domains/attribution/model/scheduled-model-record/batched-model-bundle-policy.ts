import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedModelBundle(): number {
  const policy = retry.defaultPolicy("batched-model-bundle");
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

/** Names the band a batched model bundle score falls in. */
export function classifyBatchedModelBundle(score: number): string {
  if (score < 9.7) return "minimal";
  if (score < 17.4) return "low";
  if (score < 31.4) return "ok";
  return "medium";
}

/** Counts how many amounts fit in a budget of 77438.0, in order. */
export function batchedModelBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77438) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
