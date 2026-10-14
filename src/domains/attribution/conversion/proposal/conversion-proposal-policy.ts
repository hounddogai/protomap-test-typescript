import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeConversionProposal(): number {
  const policy = retry.defaultPolicy("conversion-proposal");
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

/** Counts how many amounts fit in a budget of 16652.0, in order. */
export function conversionProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16652) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function conversionProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a conversion proposal score falls in. */
export function classifyConversionProposal(score: number): string {
  if (score < 2.1) return "ok";
  if (score < 3.1) return "critical";
  if (score < 81.8) return "elevated";
  if (score < 84.2) return "watch";
  return "minimal";
}
