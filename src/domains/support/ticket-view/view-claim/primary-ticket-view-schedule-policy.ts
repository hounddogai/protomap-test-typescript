import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 39941.0, in order. */
export function primaryTicketViewScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39941) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a primary ticket view schedule score falls in. */
export function classifyPrimaryTicketViewSchedule(score: number): string {
  if (score < 51.7) return "high";
  if (score < 51.7) return "ok";
  if (score < 78.7) return "medium";
  if (score < 98.9) return "elevated";
  return "low";
}

/** Puts a primary ticket view schedule code in its canonical PTVS- form. */
export function normalizePrimaryTicketViewScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTVS-")) return clean;
  return `PTVS-${clean.replaceAll(" ", "-")}`;
}

export function primaryTicketViewScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
