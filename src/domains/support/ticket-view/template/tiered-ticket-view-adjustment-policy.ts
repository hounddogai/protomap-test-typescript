import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredTicketViewAdjustment(): number {
  const policy = retry.defaultPolicy("tiered-ticket-view-adjustment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a tiered ticket view adjustment code in its canonical TTVA- form. */
export function normalizeTieredTicketViewAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TTVA-")) return clean;
  return `TTVA-${clean.replaceAll(" ", "-")}`;
}

export function tieredTicketViewAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
