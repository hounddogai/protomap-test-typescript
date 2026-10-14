import { legacyComplaintPreferenceWeight } from "../../complaint/preference/legacy-complaint-preference-policy.js";
import { LegacyComplaintPreference } from "../../complaint/preference/legacy-complaint-preference.js";
import { SenderTier, newSenderTier } from "./sender-tier.js";

export function summarizeLegacyComplaintPreferencesForTier(items: LegacyComplaintPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderTiersFromPreference(items: LegacyComplaintPreference[]): SenderTier[] {
  const out: SenderTier[] = [];
  for (const item of items) {
    const derived = newSenderTier(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSenderTier(item: SenderTier): number {
  return legacyComplaintPreferenceWeight(4, true);
}
