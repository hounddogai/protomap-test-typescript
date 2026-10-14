import * as retry from "../../../../kit/retry.js";

/** Names the band a batched cohort override score falls in. */
export function classifyBatchedCohortOverride(score: number): string {
  if (score < 16.4) return "medium";
  if (score < 23.3) return "watch";
  if (score < 81.2) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedCohortOverride(): number {
  const policy = retry.defaultPolicy("batched-cohort-override");
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

/** Puts a batched cohort override code in its canonical BCO- form. */
export function normalizeBatchedCohortOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCO-")) return clean;
  return `BCO-${clean.replaceAll(" ", "-")}`;
}
