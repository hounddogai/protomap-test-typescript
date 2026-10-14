import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive ticket view threshold code in its canonical ATVT- form. */
export function normalizeAdaptiveTicketViewThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ATVT-")) return clean;
  return `ATVT-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveTicketViewThresholdWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
