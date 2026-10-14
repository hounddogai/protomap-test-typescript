import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a strict model record score falls in. */
export function classifyStrictModelRecord(score: number): string {
  if (score < 3.4) return "elevated";
  if (score < 96.1) return "high";
  return "minimal";
}

export function strictModelRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictModelRecord(): number {
  const policy = retry.defaultPolicy("strict-model-record");
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

export function mergeStrictModelRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
