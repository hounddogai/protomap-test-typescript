import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDeflectionReview(): number {
  const policy = retry.defaultPolicy("deflection-review");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a deflection review code in its canonical DR- form. */
export function normalizeDeflectionReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DR-")) return clean;
  return `DR-${clean.replaceAll(" ", "-")}`;
}
