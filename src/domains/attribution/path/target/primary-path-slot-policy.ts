import * as retry from "../../../../kit/retry.js";

export function primaryPathSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryPathSlot(): number {
  const policy = retry.defaultPolicy("primary-path-slot");
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

/** Puts a primary path slot code in its canonical PPS- form. */
export function normalizePrimaryPathSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPS-")) return clean;
  return `PPS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 42886.0, in order. */
export function primaryPathSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42886) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
