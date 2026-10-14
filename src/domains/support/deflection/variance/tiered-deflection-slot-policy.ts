import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredDeflectionSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredDeflectionSlot(): number {
  const policy = retry.defaultPolicy("tiered-deflection-slot");
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

/** Counts how many amounts fit in a budget of 9549.0, in order. */
export function tieredDeflectionSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9549) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a tiered deflection slot code in its canonical TDS- form. */
export function normalizeTieredDeflectionSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TDS-")) return clean;
  return `TDS-${clean.replaceAll(" ", "-")}`;
}
