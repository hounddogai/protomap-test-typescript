import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function globalFlightProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.6;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalFlightProposal(): number {
  const policy = retry.defaultPolicy("global-flight-proposal");
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

/** Puts a global flight proposal code in its canonical GFP- form. */
export function normalizeGlobalFlightProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GFP-")) return clean;
  return `GFP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a global flight proposal score falls in. */
export function classifyGlobalFlightProposal(score: number): string {
  if (score < 6.4) return "elevated";
  if (score < 17.9) return "critical";
  if (score < 62.3) return "minimal";
  return "ok";
}
