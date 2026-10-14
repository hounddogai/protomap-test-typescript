import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a creative agreement code in its canonical CA- form. */
export function normalizeCreativeAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CA-")) return clean;
  return `CA-${clean.replaceAll(" ", "-")}`;
}

export function mergeCreativeAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a creative agreement score falls in. */
export function classifyCreativeAgreement(score: number): string {
  if (score < 55.3) return "low";
  if (score < 67.7) return "high";
  return "critical";
}
