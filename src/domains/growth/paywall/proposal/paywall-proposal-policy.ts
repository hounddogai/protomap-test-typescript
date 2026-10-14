import * as retry from "../../../../kit/retry.js";

/** Puts a paywall proposal code in its canonical PP- form. */
export function normalizePaywallProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallProposal(): number {
  const policy = retry.defaultPolicy("paywall-proposal");
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
