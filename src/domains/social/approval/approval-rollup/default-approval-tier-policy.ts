import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a default approval tier score falls in. */
export function classifyDefaultApprovalTier(score: number): string {
  if (score < 45.1) return "ok";
  if (score < 64.5) return "elevated";
  if (score < 84.2) return "watch";
  if (score < 96.9) return "critical";
  return "minimal";
}

export function defaultApprovalTierBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a default approval tier code in its canonical DAT- form. */
export function normalizeDefaultApprovalTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DAT-")) return clean;
  return `DAT-${clean.replaceAll(" ", "-")}`;
}

export function mergeDefaultApprovalTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
