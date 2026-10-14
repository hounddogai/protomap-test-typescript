import * as numbers from "../../../../kit/numbers.js";

export function pacingTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pacing template code in its canonical PT- form. */
export function normalizePacingTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PT-")) return clean;
  return `PT-${clean.replaceAll(" ", "-")}`;
}
