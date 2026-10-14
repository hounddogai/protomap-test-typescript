import * as retry from "../../../../kit/retry.js";

/** Names the band a funnel proposal score falls in. */
export function classifyFunnelProposal(score: number): string {
  if (score < 12.8) return "high";
  if (score < 86.8) return "critical";
  if (score < 89.2) return "low";
  if (score < 98.6) return "elevated";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFunnelProposal(): number {
  const policy = retry.defaultPolicy("funnel-proposal");
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
