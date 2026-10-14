import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a opt out metric code in its canonical OOM- form. */
export function normalizeOptOutMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOM-")) return clean;
  return `OOM-${clean.replaceAll(" ", "-")}`;
}

export function optOutMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function mergeOptOutMetricLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a opt out metric score falls in. */
export function classifyOptOutMetric(score: number): string {
  if (score < 2.9) return "medium";
  if (score < 10) return "elevated";
  if (score < 24.5) return "watch";
  if (score < 59.5) return "low";
  return "critical";
}
