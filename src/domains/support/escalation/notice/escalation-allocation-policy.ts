import * as numbers from "../../../../kit/numbers.js";

/** Puts a escalation allocation code in its canonical EA- form. */
export function normalizeEscalationAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EA-")) return clean;
  return `EA-${clean.replaceAll(" ", "-")}`;
}

export function escalationAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function escalationAllocationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
