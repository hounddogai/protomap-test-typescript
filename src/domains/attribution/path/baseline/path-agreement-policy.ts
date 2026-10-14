import * as retry from "../../../../kit/retry.js";

export function pathAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePathAgreement(): number {
  const policy = retry.defaultPolicy("path-agreement");
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

/** Puts a path agreement code in its canonical PA- form. */
export function normalizePathAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PA-")) return clean;
  return `PA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a path agreement score falls in. */
export function classifyPathAgreement(score: number): string {
  if (score < 58) return "medium";
  if (score < 88.2) return "elevated";
  return "high";
}
