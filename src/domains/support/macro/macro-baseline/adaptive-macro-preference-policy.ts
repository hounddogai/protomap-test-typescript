import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveMacroPreference(): number {
  const policy = retry.defaultPolicy("adaptive-macro-preference");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a adaptive macro preference score falls in. */
export function classifyAdaptiveMacroPreference(score: number): string {
  if (score < 7.7) return "high";
  if (score < 61.1) return "watch";
  if (score < 71.9) return "low";
  if (score < 82.7) return "critical";
  return "ok";
}

export function adaptiveMacroPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a adaptive macro preference code in its canonical AMP- form. */
export function normalizeAdaptiveMacroPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AMP-")) return clean;
  return `AMP-${clean.replaceAll(" ", "-")}`;
}
