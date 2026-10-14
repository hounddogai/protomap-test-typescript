import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a batched branch agreement score falls in. */
export function classifyBatchedBranchAgreement(score: number): string {
  if (score < 20.6) return "elevated";
  if (score < 55.5) return "low";
  return "minimal";
}

/** Puts a batched branch agreement code in its canonical BBA- form. */
export function normalizeBatchedBranchAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BBA-")) return clean;
  return `BBA-${clean.replaceAll(" ", "-")}`;
}

export function mergeBatchedBranchAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function batchedBranchAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}
