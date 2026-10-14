import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeBatchedRewardRuleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedRewardRule(): number {
  const policy = retry.defaultPolicy("batched-reward-rule");
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

/** Puts a batched reward rule code in its canonical BRR- form. */
export function normalizeBatchedRewardRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRR-")) return clean;
  return `BRR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 42575.0, in order. */
export function batchedRewardRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42575) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
