import * as numbers from "../../../../kit/numbers.js";

export function lenientMentionClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.79;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a lenient mention claim code in its canonical LMC- form. */
export function normalizeLenientMentionClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LMC-")) return clean;
  return `LMC-${clean.replaceAll(" ", "-")}`;
}
