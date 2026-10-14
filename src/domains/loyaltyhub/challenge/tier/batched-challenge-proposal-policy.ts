import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedChallengeProposal(): number {
  const policy = retry.defaultPolicy("batched-challenge-proposal");
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

/** Puts a batched challenge proposal code in its canonical BCP- form. */
export function normalizeBatchedChallengeProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BCP-")) return clean;
  return `BCP-${clean.replaceAll(" ", "-")}`;
}
