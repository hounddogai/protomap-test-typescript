import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a funnel agreement code in its canonical FA- form. */
export function normalizeFunnelAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FA-")) return clean;
  return `FA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a funnel agreement score falls in. */
export function classifyFunnelAgreement(score: number): string {
  if (score < 18.8) return "low";
  if (score < 78) return "high";
  return "elevated";
}

export function mergeFunnelAgreementLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function funnelAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
