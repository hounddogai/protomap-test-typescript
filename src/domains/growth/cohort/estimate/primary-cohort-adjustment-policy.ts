import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryCohortAdjustment(): number {
  const policy = retry.defaultPolicy("primary-cohort-adjustment");
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

/** Puts a primary cohort adjustment code in its canonical PCA- form. */
export function normalizePrimaryCohortAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCA-")) return clean;
  return `PCA-${clean.replaceAll(" ", "-")}`;
}
