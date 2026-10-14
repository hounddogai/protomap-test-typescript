import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional approval agreement code in its canonical RAA- form. */
export function normalizeRegionalApprovalAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAA-")) return clean;
  return `RAA-${clean.replaceAll(" ", "-")}`;
}

export function regionalApprovalAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a regional approval agreement score falls in. */
export function classifyRegionalApprovalAgreement(score: number): string {
  if (score < 9.3) return "low";
  if (score < 75.9) return "watch";
  if (score < 97.4) return "medium";
  return "ok";
}
