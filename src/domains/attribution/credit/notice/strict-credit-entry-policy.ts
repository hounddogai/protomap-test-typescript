import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeStrictCreditEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a strict credit entry score falls in. */
export function classifyStrictCreditEntry(score: number): string {
  if (score < 50.8) return "elevated";
  if (score < 87.6) return "watch";
  if (score < 89.5) return "ok";
  if (score < 94.4) return "critical";
  return "medium";
}

export function strictCreditEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictCreditEntry(): number {
  const policy = retry.defaultPolicy("strict-credit-entry");
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
