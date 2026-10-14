import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 71891.0, in order. */
export function csatMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 71891) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a csat mapping code in its canonical CM- form. */
export function normalizeCsatMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CM-")) return clean;
  return `CM-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a csat mapping score falls in. */
export function classifyCsatMapping(score: number): string {
  if (score < 30.5) return "high";
  if (score < 76.1) return "minimal";
  if (score < 79) return "medium";
  if (score < 91.1) return "watch";
  return "critical";
}

export function csatMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
