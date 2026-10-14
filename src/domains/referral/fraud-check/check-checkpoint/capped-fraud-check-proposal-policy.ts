import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedFraudCheckProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a capped fraud check proposal code in its canonical CFCP- form. */
export function normalizeCappedFraudCheckProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CFCP-")) return clean;
  return `CFCP-${clean.replaceAll(" ", "-")}`;
}

export function cappedFraudCheckProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
