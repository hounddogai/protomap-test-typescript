import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a preference variance score falls in. */
export function classifyPreferenceVariance(score: number): string {
  if (score < 23.3) return "watch";
  if (score < 56.7) return "critical";
  if (score < 91.3) return "medium";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePreferenceVariance(): number {
  const policy = retry.defaultPolicy("preference-variance");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 470.0, in order. */
export function preferenceVarianceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 470) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePreferenceVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
