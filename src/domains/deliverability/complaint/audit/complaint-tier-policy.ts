import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Puts a complaint tier code in its canonical CT- form. */
export function normalizeComplaintTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}

export function complaintTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a complaint tier score falls in. */
export function classifyComplaintTier(score: number): string {
  if (score < 44.2) return "ok";
  if (score < 80.7) return "medium";
  return "critical";
}

export function mergeComplaintTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
