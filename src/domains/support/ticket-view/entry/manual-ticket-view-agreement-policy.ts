import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual ticket view agreement score falls in. */
export function classifyManualTicketViewAgreement(score: number): string {
  if (score < 15.5) return "minimal";
  if (score < 78.4) return "high";
  if (score < 81.5) return "medium";
  return "ok";
}

export function manualTicketViewAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
