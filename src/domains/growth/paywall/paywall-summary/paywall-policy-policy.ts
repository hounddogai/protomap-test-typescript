import * as numbers from "../../../../kit/numbers.js";

/** Names the band a paywall policy score falls in. */
export function classifyPaywallPolicy(score: number): string {
  if (score < 67.1) return "medium";
  if (score < 78.1) return "ok";
  return "high";
}

export function paywallPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.67;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a paywall policy code in its canonical PP- form. */
export function normalizePaywallPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 89710.0, in order. */
export function paywallPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89710) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
