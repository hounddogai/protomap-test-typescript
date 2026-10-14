import * as retry from "../../../../kit/retry.js";

/** Names the band a post schedule score falls in. */
export function classifyPostSchedule(score: number): string {
  if (score < 58) return "ok";
  if (score < 74.6) return "minimal";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 88680.0, in order. */
export function postScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88680) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostSchedule(): number {
  const policy = retry.defaultPolicy("post-schedule");
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
