import { classifyFrequencyProposal } from "../../frequency/slot/frequency-proposal-policy.js";
import { FrequencyReview } from "../../frequency/slot/frequency-review.js";
import { FlightSlot, newFlightSlot } from "./flight-slot.js";

export function summarizeFrequencyReviewsForSlot(items: FrequencyReview[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveFlightSlotsFromReview(items: FrequencyReview[]): FlightSlot[] {
  const out: FlightSlot[] = [];
  for (const item of items) {
    const derived = newFlightSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeFlightSlot(item: FlightSlot): string {
  return classifyFrequencyProposal(item.adjustedExposure());
}
