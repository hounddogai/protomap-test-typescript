import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 4373.0, in order. */
export function domainCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 4373) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function domainCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDomainCheckpoint(): number {
  const policy = retry.defaultPolicy("domain-checkpoint");
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
