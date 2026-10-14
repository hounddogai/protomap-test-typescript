import * as numbers from "../../../../kit/numbers.js";

export function domainEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a domain estimate code in its canonical DE- form. */
export function normalizeDomainEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DE-")) return clean;
  return `DE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a domain estimate score falls in. */
export function classifyDomainEstimate(score: number): string {
  if (score < 4.4) return "ok";
  if (score < 7.4) return "high";
  if (score < 55.4) return "low";
  return "watch";
}
