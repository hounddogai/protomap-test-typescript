import * as retry from "../../../../kit/retry.js";

/** Puts a regional activation proposal code in its canonical RAP- form. */
export function normalizeRegionalActivationProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAP-")) return clean;
  return `RAP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 95437.0, in order. */
export function regionalActivationProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95437) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalActivationProposal(): number {
  const policy = retry.defaultPolicy("regional-activation-proposal");
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

export function regionalActivationProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
