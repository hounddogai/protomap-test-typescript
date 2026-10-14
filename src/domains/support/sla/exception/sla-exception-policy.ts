import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a sla exception code in its canonical SE- form. */
export function normalizeSlaExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SE-")) return clean;
  return `SE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaException(): number {
  const policy = retry.defaultPolicy("sla-exception");
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

/** Names the band a sla exception score falls in. */
export function classifySlaException(score: number): string {
  if (score < 9.4) return "minimal";
  if (score < 12.1) return "ok";
  if (score < 45.8) return "elevated";
  if (score < 82.9) return "low";
  return "medium";
}

export function slaExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
