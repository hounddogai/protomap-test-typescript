import * as numbers from "../../../../kit/numbers.js";

/** Names the band a approval plan score falls in. */
export function classifyApprovalPlan(score: number): string {
  if (score < 5.8) return "minimal";
  if (score < 13.8) return "low";
  if (score < 81.8) return "ok";
  return "elevated";
}

/** Puts a approval plan code in its canonical AP- form. */
export function normalizeApprovalPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AP-")) return clean;
  return `AP-${clean.replaceAll(" ", "-")}`;
}

export function approvalPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 9384.0, in order. */
export function approvalPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 9384) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
