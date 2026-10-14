import * as retry from "../../../../kit/retry.js";

/** Puts a weighted step window code in its canonical WSW- form. */
export function normalizeWeightedStepWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WSW-")) return clean;
  return `WSW-${clean.replaceAll(" ", "-")}`;
}

export function weightedStepWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedStepWindow(): number {
  const policy = retry.defaultPolicy("weighted-step-window");
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
