import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingDoubleOptInDigest(): number {
  const policy = retry.defaultPolicy("pending-double-opt-in-digest");
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

/** Names the band a pending double opt in digest score falls in. */
export function classifyPendingDoubleOptInDigest(score: number): string {
  if (score < 31.2) return "medium";
  if (score < 43.4) return "ok";
  if (score < 50.9) return "critical";
  if (score < 72.8) return "watch";
  return "low";
}

/** Puts a pending double opt in digest code in its canonical PDOID- form. */
export function normalizePendingDoubleOptInDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDOID-")) return clean;
  return `PDOID-${clean.replaceAll(" ", "-")}`;
}

export function pendingDoubleOptInDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
