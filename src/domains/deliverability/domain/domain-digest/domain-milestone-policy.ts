import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeDomainMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function domainMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a domain milestone score falls in. */
export function classifyDomainMilestone(score: number): string {
  if (score < 23.5) return "medium";
  if (score < 66.6) return "critical";
  if (score < 75.6) return "watch";
  if (score < 78.2) return "ok";
  return "elevated";
}

/** Puts a domain milestone code in its canonical DM- form. */
export function normalizeDomainMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DM-")) return clean;
  return `DM-${clean.replaceAll(" ", "-")}`;
}
