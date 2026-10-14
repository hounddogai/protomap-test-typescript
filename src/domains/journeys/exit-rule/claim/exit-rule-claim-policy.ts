import * as numbers from "../../../../kit/numbers.js";

export function exitRuleClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a exit rule claim code in its canonical ERC- form. */
export function normalizeExitRuleClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERC-")) return clean;
  return `ERC-${clean.replaceAll(" ", "-")}`;
}

export function exitRuleClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
