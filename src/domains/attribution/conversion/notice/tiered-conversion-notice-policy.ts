import * as retry from "../../../../kit/retry.js";

/** Puts a tiered conversion notice code in its canonical TCN- form. */
export function normalizeTieredConversionNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TCN-")) return clean;
  return `TCN-${clean.replaceAll(" ", "-")}`;
}

export function tieredConversionNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredConversionNotice(): number {
  const policy = retry.defaultPolicy("tiered-conversion-notice");
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

/** Counts how many amounts fit in a budget of 51299.0, in order. */
export function tieredConversionNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51299) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
