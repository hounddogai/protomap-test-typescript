import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function subscriptionPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a subscription preference score falls in. */
export function classifySubscriptionPreference(score: number): string {
  if (score < 10.6) return "medium";
  if (score < 28.5) return "minimal";
  return "high";
}

/** Puts a subscription preference code in its canonical SP- form. */
export function normalizeSubscriptionPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SP-")) return clean;
  return `SP-${clean.replaceAll(" ", "-")}`;
}

export function mergeSubscriptionPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
