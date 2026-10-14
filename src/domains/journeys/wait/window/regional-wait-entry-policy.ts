import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function regionalWaitEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalWaitEntry(): number {
  const policy = retry.defaultPolicy("regional-wait-entry");
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

/** Counts how many amounts fit in a budget of 48590.0, in order. */
export function regionalWaitEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 48590) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a regional wait entry score falls in. */
export function classifyRegionalWaitEntry(score: number): string {
  if (score < 6.8) return "high";
  if (score < 54.8) return "minimal";
  return "watch";
}
