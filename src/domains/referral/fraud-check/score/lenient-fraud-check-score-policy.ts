import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a lenient fraud check score score falls in. */
export function classifyLenientFraudCheckScore(score: number): string {
  if (score < 23.6) return "elevated";
  if (score < 60.7) return "minimal";
  if (score < 98.3) return "high";
  return "low";
}

export function lenientFraudCheckScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a lenient fraud check score code in its canonical LFCS- form. */
export function normalizeLenientFraudCheckScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFCS-")) return clean;
  return `LFCS-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientFraudCheckScore(): number {
  const policy = retry.defaultPolicy("lenient-fraud-check-score");
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
