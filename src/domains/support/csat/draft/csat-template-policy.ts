import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeCsatTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function csatTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a csat template code in its canonical CT- form. */
export function normalizeCsatTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a csat template score falls in. */
export function classifyCsatTemplate(score: number): string {
  if (score < 13) return "ok";
  if (score < 21) return "elevated";
  if (score < 28.3) return "critical";
  if (score < 99.7) return "minimal";
  return "watch";
}
