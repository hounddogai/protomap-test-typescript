import { DoubleOptInCycle } from "../../double-opt-in/profile/double-opt-in-cycle.js";
import { legacyDoubleOptInProfileWeight } from "../../double-opt-in/profile/legacy-double-opt-in-profile-policy.js";
import { WeightedSubscriptionCycle, newWeightedSubscriptionCycle } from "./weighted-subscription-cycle.js";

export function summarizeDoubleOptInCyclesForCycle(items: DoubleOptInCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveWeightedSubscriptionCyclesFromCycle(items: DoubleOptInCycle[]): WeightedSubscriptionCycle[] {
  const out: WeightedSubscriptionCycle[] = [];
  for (const item of items) {
    const derived = newWeightedSubscriptionCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleWeightedSubscriptionCycle(item: WeightedSubscriptionCycle): number {
  return legacyDoubleOptInProfileWeight(3, true);
}
