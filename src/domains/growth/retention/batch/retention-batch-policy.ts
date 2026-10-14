import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionBatch(): number {
  const policy = retry.defaultPolicy("retention-batch");
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

/** Names the band a retention batch score falls in. */
export function classifyRetentionBatch(score: number): string {
  if (score < 43.4) return "watch";
  if (score < 60) return "minimal";
  if (score < 83.1) return "medium";
  return "low";
}

/** Counts how many amounts fit in a budget of 17855.0, in order. */
export function retentionBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17855) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
