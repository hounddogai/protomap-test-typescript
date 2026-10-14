import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTierBaseline(): number {
  const policy = retry.defaultPolicy("tier-baseline");
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

export function mergeTierBaselineLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a tier baseline code in its canonical TB- form. */
export function normalizeTierBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TB-")) return clean;
  return `TB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 96746.0, in order. */
export function tierBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96746) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
