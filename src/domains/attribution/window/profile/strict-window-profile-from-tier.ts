import { conversionTierWeight } from "../../conversion/tier/conversion-tier-policy.js";
import { ManualConversionTier } from "../../conversion/tier/manual-conversion-tier.js";
import { StrictWindowProfile, newStrictWindowProfile } from "./strict-window-profile.js";

export function summarizeManualConversionTiersForProfile(items: ManualConversionTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveStrictWindowProfilesFromTier(items: ManualConversionTier[]): StrictWindowProfile[] {
  const out: StrictWindowProfile[] = [];
  for (const item of items) {
    const derived = newStrictWindowProfile(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileStrictWindowProfile(item: StrictWindowProfile): number {
  return conversionTierWeight(8, true);
}
