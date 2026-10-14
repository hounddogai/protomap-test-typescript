import * as retry from "../../../../kit/retry.js";

/** Puts a pending escalation exception code in its canonical PEE- form. */
export function normalizePendingEscalationExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PEE-")) return clean;
  return `PEE-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingEscalationException(): number {
  const policy = retry.defaultPolicy("pending-escalation-exception");
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
