import * as retry from "../../../../kit/retry.js";

/** Puts a escalation summary code in its canonical ES- form. */
export function normalizeEscalationSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ES-")) return clean;
  return `ES-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationSummary(): number {
  const policy = retry.defaultPolicy("escalation-summary");
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
