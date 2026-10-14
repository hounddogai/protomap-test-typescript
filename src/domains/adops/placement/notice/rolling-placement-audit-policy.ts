import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a rolling placement audit code in its canonical RPA- form. */
export function normalizeRollingPlacementAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RPA-")) return clean;
  return `RPA-${clean.replaceAll(" ", "-")}`;
}

export function mergeRollingPlacementAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function rollingPlacementAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a rolling placement audit score falls in. */
export function classifyRollingPlacementAudit(score: number): string {
  if (score < 58.9) return "elevated";
  if (score < 62) return "watch";
  if (score < 65.1) return "critical";
  return "medium";
}
