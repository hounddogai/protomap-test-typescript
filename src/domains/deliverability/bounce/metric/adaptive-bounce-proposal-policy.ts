import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive bounce proposal code in its canonical ABP- form. */
export function normalizeAdaptiveBounceProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ABP-")) return clean;
  return `ABP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveBounceProposal(): number {
  const policy = retry.defaultPolicy("adaptive-bounce-proposal");
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

/** Names the band a adaptive bounce proposal score falls in. */
export function classifyAdaptiveBounceProposal(score: number): string {
  if (score < 24.8) return "minimal";
  if (score < 72.6) return "low";
  if (score < 86.3) return "high";
  return "elevated";
}
