import * as retry from "../../../../kit/retry.js";

/** Puts a sender plan code in its canonical SP- form. */
export function normalizeSenderPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SP-")) return clean;
  return `SP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderPlan(): number {
  const policy = retry.defaultPolicy("sender-plan");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a sender plan score falls in. */
export function classifySenderPlan(score: number): string {
  if (score < 2.3) return "medium";
  if (score < 91.5) return "minimal";
  return "watch";
}
