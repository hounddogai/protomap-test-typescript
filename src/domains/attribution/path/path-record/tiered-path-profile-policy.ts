import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredPathProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredPathProfile(): number {
  const policy = retry.defaultPolicy("tiered-path-profile");
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

export function tieredPathProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a tiered path profile code in its canonical TPP- form. */
export function normalizeTieredPathProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPP-")) return clean;
  return `TPP-${clean.replaceAll(" ", "-")}`;
}
