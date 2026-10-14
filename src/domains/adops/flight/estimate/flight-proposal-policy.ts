import * as numbers from "../../../../kit/numbers.js";

export function flightProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a flight proposal score falls in. */
export function classifyFlightProposal(score: number): string {
  if (score < 27.4) return "low";
  if (score < 28.6) return "high";
  if (score < 81.5) return "medium";
  if (score < 89.1) return "watch";
  return "critical";
}

export function flightProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a flight proposal code in its canonical FP- form. */
export function normalizeFlightProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FP-")) return clean;
  return `FP-${clean.replaceAll(" ", "-")}`;
}
