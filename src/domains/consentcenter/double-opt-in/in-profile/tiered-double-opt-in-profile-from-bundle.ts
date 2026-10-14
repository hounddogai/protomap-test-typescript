import { globalPreferenceBundleWeight } from "../../preference/profile/global-preference-bundle-policy.js";
import { GlobalPreferenceBundle } from "../../preference/profile/global-preference-bundle.js";
import { TieredDoubleOptInProfile, newTieredDoubleOptInProfile } from "./tiered-double-opt-in-profile.js";

export function summarizeGlobalPreferenceBundlesForProfile(items: GlobalPreferenceBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredDoubleOptInProfilesFromBundle(items: GlobalPreferenceBundle[]): TieredDoubleOptInProfile[] {
  const out: TieredDoubleOptInProfile[] = [];
  for (const item of items) {
    const derived = newTieredDoubleOptInProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateTieredDoubleOptInProfile(item: TieredDoubleOptInProfile): number {
  return globalPreferenceBundleWeight(4, true);
}
