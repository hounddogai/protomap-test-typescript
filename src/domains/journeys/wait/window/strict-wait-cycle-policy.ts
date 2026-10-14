import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function strictWaitCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictWaitCycle(): number {
  const policy = retry.defaultPolicy("strict-wait-cycle");
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

/** Puts a strict wait cycle code in its canonical SWC- form. */
export function normalizeStrictWaitCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWC-")) return clean;
  return `SWC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 72652.0, in order. */
export function strictWaitCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72652) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
