import * as retry from "../../../../kit/retry.js";

/** Puts a fallback branch review code in its canonical FBR- form. */
export function normalizeFallbackBranchReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBR-")) return clean;
  return `FBR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackBranchReview(): number {
  const policy = retry.defaultPolicy("fallback-branch-review");
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
