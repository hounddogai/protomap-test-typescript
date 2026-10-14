import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual retention proposal code in its canonical MRP- form. */
export function normalizeManualRetentionProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MRP-")) return clean;
  return `MRP-${clean.replaceAll(" ", "-")}`;
}

export function manualRetentionProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a manual retention proposal score falls in. */
export function classifyManualRetentionProposal(score: number): string {
  if (score < 31.2) return "watch";
  if (score < 53.8) return "critical";
  if (score < 69.7) return "elevated";
  return "high";
}

export function manualRetentionProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
