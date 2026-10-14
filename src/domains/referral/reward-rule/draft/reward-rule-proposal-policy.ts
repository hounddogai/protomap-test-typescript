import * as retry from "../../../../kit/retry.js";

export function rewardRuleProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRewardRuleProposal(): number {
  const policy = retry.defaultPolicy("reward-rule-proposal");
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

/** Names the band a reward rule proposal score falls in. */
export function classifyRewardRuleProposal(score: number): string {
  if (score < 15.8) return "high";
  if (score < 58.6) return "minimal";
  return "medium";
}

/** Puts a reward rule proposal code in its canonical RRP- form. */
export function normalizeRewardRuleProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRP-")) return clean;
  return `RRP-${clean.replaceAll(" ", "-")}`;
}
