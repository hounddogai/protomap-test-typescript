import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function regionalTouchpointAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeRegionalTouchpointAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a regional touchpoint audit code in its canonical RTA- form. */
export function normalizeRegionalTouchpointAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RTA-")) return clean;
  return `RTA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional touchpoint audit score falls in. */
export function classifyRegionalTouchpointAudit(score: number): string {
  if (score < 40.9) return "elevated";
  if (score < 48) return "watch";
  return "medium";
}
