import * as numbers from "../../../../kit/numbers.js";

/** Puts a default journey proposal code in its canonical DJP- form. */
export function normalizeDefaultJourneyProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DJP-")) return clean;
  return `DJP-${clean.replaceAll(" ", "-")}`;
}

export function defaultJourneyProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.72;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
