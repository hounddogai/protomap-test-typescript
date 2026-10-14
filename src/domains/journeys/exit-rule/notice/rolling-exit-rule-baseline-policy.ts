import * as retry from "../../../../kit/retry.js";

/** Puts a rolling exit rule baseline code in its canonical RERB- form. */
export function normalizeRollingExitRuleBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RERB-")) return clean;
  return `RERB-${clean.replaceAll(" ", "-")}`;
}

export function rollingExitRuleBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingExitRuleBaseline(): number {
  const policy = retry.defaultPolicy("rolling-exit-rule-baseline");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
