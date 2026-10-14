import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal window audit code in its canonical SWA- form. */
export function normalizeSeasonalWindowAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWA-")) return clean;
  return `SWA-${clean.replaceAll(" ", "-")}`;
}

export function seasonalWindowAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 60996.0, in order. */
export function seasonalWindowAuditBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 60996) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a seasonal window audit score falls in. */
export function classifySeasonalWindowAudit(score: number): string {
  if (score < 16.3) return "medium";
  if (score < 37.9) return "ok";
  if (score < 39.5) return "minimal";
  if (score < 92.4) return "watch";
  return "low";
}
