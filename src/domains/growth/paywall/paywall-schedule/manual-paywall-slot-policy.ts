import * as numbers from "../../../../kit/numbers.js";

/** Names the band a manual paywall slot score falls in. */
export function classifyManualPaywallSlot(score: number): string {
  if (score < 9.7) return "low";
  if (score < 15) return "watch";
  if (score < 62.2) return "minimal";
  if (score < 65.5) return "medium";
  return "ok";
}

export function manualPaywallSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
