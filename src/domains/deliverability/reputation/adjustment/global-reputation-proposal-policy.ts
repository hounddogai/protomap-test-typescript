import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a global reputation proposal code in its canonical GRP- form. */
export function normalizeGlobalReputationProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRP-")) return clean;
  return `GRP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalReputationProposal(): number {
  const policy = retry.defaultPolicy("global-reputation-proposal");
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

export function globalReputationProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
