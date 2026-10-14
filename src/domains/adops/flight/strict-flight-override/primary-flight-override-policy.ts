import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a primary flight override code in its canonical PFO- form. */
export function normalizePrimaryFlightOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFO-")) return clean;
  return `PFO-${clean.replaceAll(" ", "-")}`;
}

export function primaryFlightOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

export function mergePrimaryFlightOverrideLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a primary flight override score falls in. */
export function classifyPrimaryFlightOverride(score: number): string {
  if (score < 39.8) return "medium";
  if (score < 72.1) return "ok";
  return "low";
}
