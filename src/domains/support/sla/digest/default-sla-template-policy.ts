import * as numbers from "../../../../kit/numbers.js";

export function defaultSlaTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.05;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a default sla template code in its canonical DST- form. */
export function normalizeDefaultSlaTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DST-")) return clean;
  return `DST-${clean.replaceAll(" ", "-")}`;
}
