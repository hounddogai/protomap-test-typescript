import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 50224.0, in order. */
export function conversionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50224) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a conversion slot score falls in. */
export function classifyConversionSlot(score: number): string {
  if (score < 64.9) return "minimal";
  if (score < 65.5) return "critical";
  return "high";
}

export function mergeConversionSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionSlot(): number {
  const policy = retry.defaultPolicy("conversion-slot");
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
