import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a paywall slot score falls in. */
export function classifyPaywallSlot(score: number): string {
  if (score < 52.9) return "minimal";
  if (score < 56.8) return "ok";
  return "medium";
}

export function mergePaywallSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
