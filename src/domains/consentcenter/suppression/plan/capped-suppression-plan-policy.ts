import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedSuppressionPlan(): number {
  const policy = retry.defaultPolicy("capped-suppression-plan");
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

/** Puts a capped suppression plan code in its canonical CSP- form. */
export function normalizeCappedSuppressionPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSP-")) return clean;
  return `CSP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a capped suppression plan score falls in. */
export function classifyCappedSuppressionPlan(score: number): string {
  if (score < 19.5) return "medium";
  if (score < 25.2) return "elevated";
  if (score < 32.8) return "minimal";
  if (score < 66.3) return "high";
  return "critical";
}
