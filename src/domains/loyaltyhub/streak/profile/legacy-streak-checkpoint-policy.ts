import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyStreakCheckpoint(): number {
  const policy = retry.defaultPolicy("legacy-streak-checkpoint");
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

export function legacyStreakCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 45655.0, in order. */
export function legacyStreakCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45655) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
