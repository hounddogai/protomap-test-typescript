import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimarySubscriptionSegment(): number {
  const policy = retry.defaultPolicy("primary-subscription-segment");
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

/** Puts a primary subscription segment code in its canonical PSS- form. */
export function normalizePrimarySubscriptionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSS-")) return clean;
  return `PSS-${clean.replaceAll(" ", "-")}`;
}

export function primarySubscriptionSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 35688.0, in order. */
export function primarySubscriptionSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 35688) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
