import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function adaptiveSenderProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function adaptiveSenderProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive sender proposal code in its canonical ASP- form. */
export function normalizeAdaptiveSenderProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASP-")) return clean;
  return `ASP-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveSenderProposal(): number {
  const policy = retry.defaultPolicy("adaptive-sender-proposal");
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
