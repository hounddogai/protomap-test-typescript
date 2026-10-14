import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeSlaWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function slaWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 226.0, in order. */
export function slaWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 226) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaWindow(): number {
  const policy = retry.defaultPolicy("sla-window");
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
