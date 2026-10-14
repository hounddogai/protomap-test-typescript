import * as numbers from "../../../../kit/numbers.js";

export function domainBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a domain bundle code in its canonical DB- form. */
export function normalizeDomainBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DB-")) return clean;
  return `DB-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a domain bundle score falls in. */
export function classifyDomainBundle(score: number): string {
  if (score < 26.4) return "high";
  if (score < 40.8) return "critical";
  if (score < 59.3) return "elevated";
  if (score < 89.3) return "watch";
  return "minimal";
}
