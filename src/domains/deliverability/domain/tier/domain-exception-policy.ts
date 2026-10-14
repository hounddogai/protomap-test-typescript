import * as numbers from "../../../../kit/numbers.js";

export function domainExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function domainExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a domain exception code in its canonical DE- form. */
export function normalizeDomainExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DE-")) return clean;
  return `DE-${clean.replaceAll(" ", "-")}`;
}
