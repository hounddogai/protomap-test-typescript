import { PendingCsatDigest } from "../../csat/digest/pending-csat-digest.js";
import { classifyPendingCsatPolicy } from "../../csat/digest/pending-csat-policy-policy.js";
import { WeightedTicketViewOverride, newWeightedTicketViewOverride } from "./weighted-ticket-view-override.js";

export function summarizePendingCsatDigestsForOverride(items: PendingCsatDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveWeightedTicketViewOverridesFromDigest(items: PendingCsatDigest[]): WeightedTicketViewOverride[] {
  const out: WeightedTicketViewOverride[] = [];
  for (const item of items) {
    const derived = newWeightedTicketViewOverride(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeWeightedTicketViewOverride(item: WeightedTicketViewOverride): string {
  return classifyPendingCsatPolicy(item.projectedExposure());
}
