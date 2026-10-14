import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a global deflection record code in its canonical GDR- form. */
export function normalizeGlobalDeflectionRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GDR-")) return clean;
  return `GDR-${clean.replaceAll(" ", "-")}`;
}

export function globalDeflectionRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalDeflectionRecord(): number {
  const policy = retry.defaultPolicy("global-deflection-record");
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

/** Counts how many amounts fit in a budget of 2150.0, in order. */
export function globalDeflectionRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2150) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
