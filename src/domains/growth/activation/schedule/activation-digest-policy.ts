import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function activationDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function mergeActivationDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a activation digest code in its canonical AD- form. */
export function normalizeActivationDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AD-")) return clean;
  return `AD-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a activation digest score falls in. */
export function classifyActivationDigest(score: number): string {
  if (score < 51.5) return "elevated";
  if (score < 52.8) return "critical";
  if (score < 69.4) return "medium";
  return "watch";
}
