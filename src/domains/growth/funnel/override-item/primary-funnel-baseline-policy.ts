import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary funnel baseline score falls in. */
export function classifyPrimaryFunnelBaseline(score: number): string {
  if (score < 54.8) return "critical";
  if (score < 95.3) return "minimal";
  return "low";
}

export function primaryFunnelBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.16;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a primary funnel baseline code in its canonical PFB- form. */
export function normalizePrimaryFunnelBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFB-")) return clean;
  return `PFB-${clean.replaceAll(" ", "-")}`;
}
