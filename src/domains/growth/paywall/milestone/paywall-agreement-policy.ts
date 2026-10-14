import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergePaywallAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a paywall agreement code in its canonical PA- form. */
export function normalizePaywallAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PA-")) return clean;
  return `PA-${clean.replaceAll(" ", "-")}`;
}
