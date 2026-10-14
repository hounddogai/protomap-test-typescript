import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredConversionThreshold(): number {
  const policy = retry.defaultPolicy("tiered-conversion-threshold");
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

/** Counts how many amounts fit in a budget of 35294.0, in order. */
export function tieredConversionThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35294) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a tiered conversion threshold code in its canonical TCT- form. */
export function normalizeTieredConversionThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TCT-")) return clean;
  return `TCT-${clean.replaceAll(" ", "-")}`;
}

export function mergeTieredConversionThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
