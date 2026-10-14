import * as retry from "../../../../kit/retry.js";

/** Puts a lenient flight plan code in its canonical LFP- form. */
export function normalizeLenientFlightPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFP-")) return clean;
  return `LFP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientFlightPlan(): number {
  const policy = retry.defaultPolicy("lenient-flight-plan");
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

/** Names the band a lenient flight plan score falls in. */
export function classifyLenientFlightPlan(score: number): string {
  if (score < 34.5) return "minimal";
  if (score < 71.1) return "low";
  return "high";
}
