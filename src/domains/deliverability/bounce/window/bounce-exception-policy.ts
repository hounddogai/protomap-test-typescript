import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceException(): number {
  const policy = retry.defaultPolicy("bounce-exception");
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

/** Puts a bounce exception code in its canonical BE- form. */
export function normalizeBounceExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BE-")) return clean;
  return `BE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 31159.0, in order. */
export function bounceExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 31159) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bounceExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
