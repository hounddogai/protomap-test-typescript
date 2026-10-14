import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback suppression group score falls in. */
export function classifyFallbackSuppressionGroup(score: number): string {
  if (score < 20.9) return "low";
  if (score < 45.4) return "ok";
  return "elevated";
}

/** Puts a fallback suppression group code in its canonical FSG- form. */
export function normalizeFallbackSuppressionGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FSG-")) return clean;
  return `FSG-${clean.replaceAll(" ", "-")}`;
}

export function fallbackSuppressionGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackSuppressionGroup(): number {
  const policy = retry.defaultPolicy("fallback-suppression-group");
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
