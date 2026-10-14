import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 70725.0, in order. */
export function stepSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70725) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a step slot code in its canonical SS- form. */
export function normalizeStepSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SS-")) return clean;
  return `SS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepSlot(): number {
  const policy = retry.defaultPolicy("step-slot");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function stepSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
