import * as retry from "../../../../kit/retry.js";

export function tieredConversionQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a tiered conversion quota code in its canonical TCQ- form. */
export function normalizeTieredConversionQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TCQ-")) return clean;
  return `TCQ-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 57377.0, in order. */
export function tieredConversionQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57377) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredConversionQuota(): number {
  const policy = retry.defaultPolicy("tiered-conversion-quota");
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
