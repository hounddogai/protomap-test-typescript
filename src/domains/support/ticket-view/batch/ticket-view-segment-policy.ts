import * as numbers from "../../../../kit/numbers.js";

/** Names the band a ticket view segment score falls in. */
export function classifyTicketViewSegment(score: number): string {
  if (score < 43.1) return "critical";
  if (score < 82.2) return "low";
  if (score < 83.7) return "medium";
  if (score < 91.7) return "high";
  return "ok";
}

export function ticketViewSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
