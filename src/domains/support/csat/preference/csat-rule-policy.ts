import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function csatRuleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a csat rule code in its canonical CR- form. */
export function normalizeCsatRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CR-")) return clean;
  return `CR-${clean.replaceAll(" ", "-")}`;
}

export function csatRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatRule(): number {
  const policy = retry.defaultPolicy("csat-rule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
