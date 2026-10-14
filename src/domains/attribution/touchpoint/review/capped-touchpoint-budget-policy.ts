import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a capped touchpoint budget code in its canonical CTB- form. */
export function normalizeCappedTouchpointBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CTB-")) return clean;
  return `CTB-${clean.replaceAll(" ", "-")}`;
}

export function cappedTouchpointBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedTouchpointBudget(): number {
  const policy = retry.defaultPolicy("capped-touchpoint-budget");
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

/** Counts how many amounts fit in a budget of 2250.0, in order. */
export function cappedTouchpointBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2250) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
