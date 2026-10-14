import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 89606.0, in order. */
export function complaintClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89606) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintClaim(): number {
  const policy = retry.defaultPolicy("complaint-claim");
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

export function complaintClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a complaint claim code in its canonical CC- form. */
export function normalizeComplaintClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CC-")) return clean;
  return `CC-${clean.replaceAll(" ", "-")}`;
}
