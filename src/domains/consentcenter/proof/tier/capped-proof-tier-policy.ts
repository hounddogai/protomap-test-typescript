import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a capped proof tier score falls in. */
export function classifyCappedProofTier(score: number): string {
  if (score < 31.8) return "ok";
  if (score < 34.1) return "minimal";
  if (score < 84) return "medium";
  return "critical";
}

/** Puts a capped proof tier code in its canonical CPT- form. */
export function normalizeCappedProofTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CPT-")) return clean;
  return `CPT-${clean.replaceAll(" ", "-")}`;
}

export function mergeCappedProofTierLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
