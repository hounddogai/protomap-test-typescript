import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a domain threshold code in its canonical DT- form. */
export function normalizeDomainThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DT-")) return clean;
  return `DT-${clean.replaceAll(" ", "-")}`;
}

export function domainThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function domainThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.47;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDomainThreshold(): number {
  const policy = retry.defaultPolicy("domain-threshold");
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
