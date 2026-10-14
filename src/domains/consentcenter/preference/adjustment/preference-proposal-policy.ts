import * as numbers from "../../../../kit/numbers.js";

export function preferenceProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a preference proposal score falls in. */
export function classifyPreferenceProposal(score: number): string {
  if (score < 1.1) return "high";
  if (score < 47.9) return "critical";
  if (score < 71.1) return "medium";
  return "low";
}

/** Puts a preference proposal code in its canonical PP- form. */
export function normalizePreferenceProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}
