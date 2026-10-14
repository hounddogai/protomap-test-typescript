import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function complaintVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeComplaintVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a complaint variance code in its canonical CV- form. */
export function normalizeComplaintVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CV-")) return clean;
  return `CV-${clean.replaceAll(" ", "-")}`;
}
