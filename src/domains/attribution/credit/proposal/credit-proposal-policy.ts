import * as numbers from "../../../../kit/numbers.js";

/** Names the band a credit proposal score falls in. */
export function classifyCreditProposal(score: number): string {
  if (score < 4.6) return "ok";
  if (score < 56.9) return "critical";
  return "high";
}

export function creditProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a credit proposal code in its canonical CP- form. */
export function normalizeCreditProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CP-")) return clean;
  return `CP-${clean.replaceAll(" ", "-")}`;
}

export function creditProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
