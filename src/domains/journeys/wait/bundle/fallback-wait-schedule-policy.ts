import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 67044.0, in order. */
export function fallbackWaitScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 67044) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback wait schedule code in its canonical FWS- form. */
export function normalizeFallbackWaitScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FWS-")) return clean;
  return `FWS-${clean.replaceAll(" ", "-")}`;
}

export function fallbackWaitScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackWaitSchedule(): number {
  const policy = retry.defaultPolicy("fallback-wait-schedule");
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
