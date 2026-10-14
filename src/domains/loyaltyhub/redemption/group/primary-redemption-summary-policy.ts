import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primaryRedemptionSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary redemption summary code in its canonical PRS- form. */
export function normalizePrimaryRedemptionSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRS-")) return clean;
  return `PRS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary redemption summary score falls in. */
export function classifyPrimaryRedemptionSummary(score: number): string {
  if (score < 8.3) return "low";
  if (score < 11.2) return "elevated";
  if (score < 11.9) return "medium";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryRedemptionSummary(): number {
  const policy = retry.defaultPolicy("primary-redemption-summary");
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
