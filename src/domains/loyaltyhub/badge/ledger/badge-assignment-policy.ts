import * as retry from "../../../../kit/retry.js";

export function badgeAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 18376.0, in order. */
export function badgeAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18376) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a badge assignment code in its canonical BA- form. */
export function normalizeBadgeAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBadgeAssignment(): number {
  const policy = retry.defaultPolicy("badge-assignment");
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
