import * as retry from "../../../../kit/retry.js";

/** Names the band a cohort tier score falls in. */
export function classifyCohortTier(score: number): string {
  if (score < 70.7) return "medium";
  if (score < 73.4) return "minimal";
  return "elevated";
}

export function cohortTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortTier(): number {
  const policy = retry.defaultPolicy("cohort-tier");
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

/** Puts a cohort tier code in its canonical CT- form. */
export function normalizeCohortTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}
