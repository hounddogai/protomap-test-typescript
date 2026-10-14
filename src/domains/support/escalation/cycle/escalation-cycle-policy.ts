import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEscalationCycle(): number {
  const policy = retry.defaultPolicy("escalation-cycle");
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

/** Puts a escalation cycle code in its canonical EC- form. */
export function normalizeEscalationCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("EC-")) return clean;
  return `EC-${clean.replaceAll(" ", "-")}`;
}
