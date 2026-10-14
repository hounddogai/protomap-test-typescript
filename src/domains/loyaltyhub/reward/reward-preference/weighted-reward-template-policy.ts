import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedRewardTemplate(): number {
  const policy = retry.defaultPolicy("weighted-reward-template");
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

/** Puts a weighted reward template code in its canonical WRT- form. */
export function normalizeWeightedRewardTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRT-")) return clean;
  return `WRT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 41323.0, in order. */
export function weightedRewardTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 41323) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWeightedRewardTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
