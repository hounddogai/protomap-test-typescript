import * as numbers from "../../../../kit/numbers.js";

export function activationNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a activation notice code in its canonical AN- form. */
export function normalizeActivationNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AN-")) return clean;
  return `AN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a activation notice score falls in. */
export function classifyActivationNotice(score: number): string {
  if (score < 7.3) return "high";
  if (score < 55.9) return "ok";
  if (score < 84.4) return "watch";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 91224.0, in order. */
export function activationNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91224) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
