import * as numbers from "../../../../kit/numbers.js";

export function strictDomainReviewBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a strict domain review code in its canonical SDR- form. */
export function normalizeStrictDomainReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDR-")) return clean;
  return `SDR-${clean.replaceAll(" ", "-")}`;
}

export function strictDomainReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
