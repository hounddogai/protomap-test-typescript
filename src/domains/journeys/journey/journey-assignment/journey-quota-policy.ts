import * as numbers from "../../../../kit/numbers.js";

export function journeyQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a journey quota code in its canonical JQ- form. */
export function normalizeJourneyQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("JQ-")) return clean;
  return `JQ-${clean.replaceAll(" ", "-")}`;
}
