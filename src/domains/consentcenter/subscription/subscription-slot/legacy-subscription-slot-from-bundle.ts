import { adaptiveOptOutProfileWeight } from "../../opt-out/out-assignment/adaptive-opt-out-profile-policy.js";
import { RegionalOptOutBundle } from "../../opt-out/out-assignment/regional-opt-out-bundle.js";
import { LegacySubscriptionSlot, newLegacySubscriptionSlot } from "./legacy-subscription-slot.js";

export function summarizeRegionalOptOutBundlesForSlot(items: RegionalOptOutBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveLegacySubscriptionSlotsFromBundle(items: RegionalOptOutBundle[]): LegacySubscriptionSlot[] {
  const out: LegacySubscriptionSlot[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceLegacySubscriptionSlot(item: LegacySubscriptionSlot): number {
  return adaptiveOptOutProfileWeight(1, true);
}
