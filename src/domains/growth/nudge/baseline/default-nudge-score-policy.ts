import * as numbers from "../../../../kit/numbers.js";

/** Names the band a default nudge score score falls in. */
export function classifyDefaultNudgeScore(score: number): string {
  if (score < 1.5) return "low";
  if (score < 4.2) return "watch";
  if (score < 13.2) return "medium";
  if (score < 13.3) return "elevated";
  return "ok";
}

export function defaultNudgeScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 17829.0, in order. */
export function defaultNudgeScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17829) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a default nudge score code in its canonical DNS- form. */
export function normalizeDefaultNudgeScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DNS-")) return clean;
  return `DNS-${clean.replaceAll(" ", "-")}`;
}
