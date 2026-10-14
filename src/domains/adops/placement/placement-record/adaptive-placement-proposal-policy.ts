import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptivePlacementProposal(): number {
  const policy = retry.defaultPolicy("adaptive-placement-proposal");
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

/** Puts a adaptive placement proposal code in its canonical APP- form. */
export function normalizeAdaptivePlacementProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APP-")) return clean;
  return `APP-${clean.replaceAll(" ", "-")}`;
}

export function adaptivePlacementProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function adaptivePlacementProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}
