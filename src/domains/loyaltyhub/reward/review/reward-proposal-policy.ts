import * as retry from "../../../../kit/retry.js";

/** Puts a reward proposal code in its canonical RP- form. */
export function normalizeRewardProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RP-")) return clean;
  return `RP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a reward proposal score falls in. */
export function classifyRewardProposal(score: number): string {
  if (score < 50.1) return "watch";
  if (score < 63.8) return "low";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 10932.0, in order. */
export function rewardProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10932) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardProposal(): number {
  const policy = retry.defaultPolicy("reward-proposal");
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
