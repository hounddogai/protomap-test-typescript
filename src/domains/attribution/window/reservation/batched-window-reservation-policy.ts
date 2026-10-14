import * as retry from "../../../../kit/retry.js";

export function batchedWindowReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a batched window reservation code in its canonical BWR- form. */
export function normalizeBatchedWindowReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWR-")) return clean;
  return `BWR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedWindowReservation(): number {
  const policy = retry.defaultPolicy("batched-window-reservation");
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

/** Counts how many amounts fit in a budget of 70682.0, in order. */
export function batchedWindowReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70682) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
