import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFrequencyBudget(): number {
  const policy = retry.defaultPolicy("frequency-budget");
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

export function frequencyBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a frequency budget code in its canonical FB- form. */
export function normalizeFrequencyBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FB-")) return clean;
  return `FB-${clean.replaceAll(" ", "-")}`;
}
