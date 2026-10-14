import * as numbers from "../../../../kit/numbers.js";

/** Names the band a domain template score falls in. */
export function classifyDomainTemplate(score: number): string {
  if (score < 7.1) return "minimal";
  if (score < 37.3) return "ok";
  return "medium";
}

/** Puts a domain template code in its canonical DT- form. */
export function normalizeDomainTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DT-")) return clean;
  return `DT-${clean.replaceAll(" ", "-")}`;
}

export function domainTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
