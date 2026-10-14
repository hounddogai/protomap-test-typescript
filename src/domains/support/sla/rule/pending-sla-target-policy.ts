import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 37021.0, in order. */
export function pendingSlaTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37021) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a pending sla target score falls in. */
export function classifyPendingSlaTarget(score: number): string {
  if (score < 32.8) return "critical";
  if (score < 33.5) return "watch";
  if (score < 77.8) return "low";
  if (score < 92.9) return "minimal";
  return "elevated";
}

/** Puts a pending sla target code in its canonical PST- form. */
export function normalizePendingSlaTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PST-")) return clean;
  return `PST-${clean.replaceAll(" ", "-")}`;
}

export function pendingSlaTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
