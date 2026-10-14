import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a adaptive activation proposal code in its canonical AAP- form. */
export function normalizeAdaptiveActivationProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AAP-")) return clean;
  return `AAP-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveActivationProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveActivationProposal(): number {
  const policy = retry.defaultPolicy("adaptive-activation-proposal");
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
