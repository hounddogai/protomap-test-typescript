import * as numbers from "../../../../kit/numbers.js";

export function ticketViewOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a ticket view override score falls in. */
export function classifyTicketViewOverride(score: number): string {
  if (score < 8.5) return "critical";
  if (score < 13.3) return "watch";
  if (score < 98.7) return "ok";
  return "elevated";
}
