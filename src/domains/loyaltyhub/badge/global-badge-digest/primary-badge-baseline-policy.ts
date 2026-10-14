import * as retry from "../../../../kit/retry.js";

/** Puts a primary badge baseline code in its canonical PBB- form. */
export function normalizePrimaryBadgeBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PBB-")) return clean;
  return `PBB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a primary badge baseline score falls in. */
export function classifyPrimaryBadgeBaseline(score: number): string {
  if (score < 4.4) return "minimal";
  if (score < 30.5) return "medium";
  if (score < 88.2) return "elevated";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryBadgeBaseline(): number {
  const policy = retry.defaultPolicy("primary-badge-baseline");
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

export function primaryBadgeBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}
