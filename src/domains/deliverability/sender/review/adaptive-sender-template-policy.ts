import * as numbers from "../../../../kit/numbers.js";

/** Names the band a adaptive sender template score falls in. */
export function classifyAdaptiveSenderTemplate(score: number): string {
  if (score < 13.7) return "minimal";
  if (score < 91) return "high";
  return "low";
}

/** Puts a adaptive sender template code in its canonical AST- form. */
export function normalizeAdaptiveSenderTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AST-")) return clean;
  return `AST-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveSenderTemplateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
