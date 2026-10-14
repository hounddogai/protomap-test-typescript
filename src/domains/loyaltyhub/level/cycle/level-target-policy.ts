import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a level target score falls in. */
export function classifyLevelTarget(score: number): string {
  if (score < 2.2) return "ok";
  if (score < 40) return "critical";
  if (score < 54.4) return "elevated";
  if (score < 74.2) return "minimal";
  return "watch";
}

export function mergeLevelTargetLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function levelTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLevelTarget(): number {
  const policy = retry.defaultPolicy("level-target");
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
