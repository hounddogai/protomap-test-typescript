import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalCsatProposal(): number {
  const policy = retry.defaultPolicy("regional-csat-proposal");
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

/** Names the band a regional csat proposal score falls in. */
export function classifyRegionalCsatProposal(score: number): string {
  if (score < 25.3) return "high";
  if (score < 45.4) return "watch";
  return "elevated";
}
