import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalCsatSlot(): number {
  const policy = retry.defaultPolicy("regional-csat-slot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeRegionalCsatSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function regionalCsatSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.19;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
