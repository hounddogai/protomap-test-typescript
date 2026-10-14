import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeQueueBatch(): number {
  const policy = retry.defaultPolicy("queue-batch");
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

/** Puts a queue batch code in its canonical QB- form. */
export function normalizeQueueBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QB-")) return clean;
  return `QB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 67131.0, in order. */
export function queueBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67131) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
