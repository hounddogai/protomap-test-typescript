import * as retry from "../../../../kit/retry.js";

/** Names the band a pacing proposal score falls in. */
export function classifyPacingProposal(score: number): string {
  if (score < 2.8) return "high";
  if (score < 35) return "elevated";
  if (score < 61.1) return "medium";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePacingProposal(): number {
  const policy = retry.defaultPolicy("pacing-proposal");
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

/** Counts how many amounts fit in a budget of 64349.0, in order. */
export function pacingProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64349) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
