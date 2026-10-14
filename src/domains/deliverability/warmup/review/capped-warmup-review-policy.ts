import * as retry from "../../../../kit/retry.js";

/** Puts a capped warmup review code in its canonical CWR- form. */
export function normalizeCappedWarmupReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CWR-")) return clean;
  return `CWR-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedWarmupReview(): number {
  const policy = retry.defaultPolicy("capped-warmup-review");
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
