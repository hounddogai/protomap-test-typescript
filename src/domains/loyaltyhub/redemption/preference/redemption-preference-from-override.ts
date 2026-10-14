import { PendingLevelOverride } from "../../level/level-quota/pending-level-override.js";
import { normalizeSeasonalLevelWindowCode } from "../../level/level-quota/seasonal-level-window-policy.js";
import { RedemptionPreference, newRedemptionPreference } from "./redemption-preference.js";

export function summarizePendingLevelOverridesForPreference(items: PendingLevelOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRedemptionPreferencesFromOverride(items: PendingLevelOverride[]): RedemptionPreference[] {
  const out: RedemptionPreference[] = [];
  for (const item of items) {
    const derived = newRedemptionPreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileRedemptionPreference(item: RedemptionPreference): string {
  return normalizeSeasonalLevelWindowCode(item.code);
}
