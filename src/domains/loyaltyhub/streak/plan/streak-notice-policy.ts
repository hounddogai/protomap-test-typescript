import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStreakNotice(): number {
  const policy = retry.defaultPolicy("streak-notice");
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

export function streakNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 55532.0, in order. */
export function streakNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55532) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a streak notice score falls in. */
export function classifyStreakNotice(score: number): string {
  if (score < 49.3) return "low";
  if (score < 61.2) return "elevated";
  if (score < 61.7) return "critical";
  return "watch";
}
