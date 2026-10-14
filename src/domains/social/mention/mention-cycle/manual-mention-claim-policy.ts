import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual mention claim code in its canonical MMC- form. */
export function normalizeManualMentionClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MMC-")) return clean;
  return `MMC-${clean.replaceAll(" ", "-")}`;
}

export function manualMentionClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
