import { optOutRequestWeight } from "../../opt-out/review/opt-out-request-policy.js";
import { ScheduledOptOutSlot } from "../../opt-out/review/scheduled-opt-out-slot.js";
import { WeightedSuppressionRequest, newWeightedSuppressionRequest } from "./weighted-suppression-request.js";

export function summarizeScheduledOptOutSlotsForRequest(items: ScheduledOptOutSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWeightedSuppressionRequestsFromSlot(items: ScheduledOptOutSlot[]): WeightedSuppressionRequest[] {
  const out: WeightedSuppressionRequest[] = [];
  for (const item of items) {
    const derived = newWeightedSuppressionRequest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreWeightedSuppressionRequest(item: WeightedSuppressionRequest): number {
  return optOutRequestWeight(7, true);
}
