import * as numbers from "../../../../kit/numbers.js";

export function branchEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a branch estimate code in its canonical BE- form. */
export function normalizeBranchEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BE-")) return clean;
  return `BE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a branch estimate score falls in. */
export function classifyBranchEstimate(score: number): string {
  if (score < 7.8) return "critical";
  if (score < 91.5) return "low";
  return "medium";
}
