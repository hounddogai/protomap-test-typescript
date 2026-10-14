import * as retry from "../../../../kit/retry.js";

/** Names the band a activation proposal score falls in. */
export function classifyActivationProposal(score: number): string {
  if (score < 59) return "low";
  if (score < 89.6) return "medium";
  return "watch";
}

export function activationProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationProposal(): number {
  const policy = retry.defaultPolicy("activation-proposal");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
