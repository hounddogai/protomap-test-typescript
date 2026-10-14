import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 78840.0, in order. */
export function globalModelTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78840) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a global model tier code in its canonical GMT- form. */
export function normalizeGlobalModelTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GMT-")) return clean;
  return `GMT-${clean.replaceAll(" ", "-")}`;
}

export function globalModelTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalModelTier(): number {
  const policy = retry.defaultPolicy("global-model-tier");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
