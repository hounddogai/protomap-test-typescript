import { classifyTierPreference } from "../../tier/preference/tier-preference-policy.js";
import { TierPreference } from "../../tier/preference/tier-preference.js";
import { LegacyInviteBatch, newLegacyInviteBatch } from "./legacy-invite-batch.js";

export function summarizeTierPreferencesForBatch(items: TierPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveLegacyInviteBatchesFromPreference(items: TierPreference[]): LegacyInviteBatch[] {
  const out: LegacyInviteBatch[] = [];
  for (const item of items) {
    const derived = newLegacyInviteBatch(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeLegacyInviteBatch(item: LegacyInviteBatch): string {
  return classifyTierPreference(item.effectiveVolume());
}
