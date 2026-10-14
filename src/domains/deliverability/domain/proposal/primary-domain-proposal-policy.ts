import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function primaryDomainProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergePrimaryDomainProposalLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a primary domain proposal code in its canonical PDP- form. */
export function normalizePrimaryDomainProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDP-")) return clean;
  return `PDP-${clean.replaceAll(" ", "-")}`;
}

export function primaryDomainProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
