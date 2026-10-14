import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 6899.0, in order. */
export function scheduledPlacementNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 6899) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledPlacementNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledPlacementNotice(): number {
  const policy = retry.defaultPolicy("scheduled-placement-notice");
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

/** Puts a scheduled placement notice code in its canonical SPN- form. */
export function normalizeScheduledPlacementNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPN-")) return clean;
  return `SPN-${clean.replaceAll(" ", "-")}`;
}
