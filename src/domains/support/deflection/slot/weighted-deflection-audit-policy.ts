import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 744.0, in order. */
export function weightedDeflectionAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 744) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedDeflectionAudit(): number {
  const policy = retry.defaultPolicy("weighted-deflection-audit");
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

/** Puts a weighted deflection audit code in its canonical WDA- form. */
export function normalizeWeightedDeflectionAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WDA-")) return clean;
  return `WDA-${clean.replaceAll(" ", "-")}`;
}

export function weightedDeflectionAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
