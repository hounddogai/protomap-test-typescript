import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 55291.0, in order. */
export function rollingOptOutProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55291) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingOptOutProposal(): number {
  const policy = retry.defaultPolicy("rolling-opt-out-proposal");
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

export function rollingOptOutProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Puts a rolling opt out proposal code in its canonical ROOP- form. */
export function normalizeRollingOptOutProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ROOP-")) return clean;
  return `ROOP-${clean.replaceAll(" ", "-")}`;
}
