import { lenientLevelRecordWeight } from "../../level/preference/lenient-level-record-policy.js";
import { TieredLevelPreference } from "../../level/preference/tiered-level-preference.js";
import { RewardTemplate, newRewardTemplate } from "./reward-template.js";

export function summarizeTieredLevelPreferencesForTemplate(items: TieredLevelPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRewardTemplatesFromPreference(items: TieredLevelPreference[]): RewardTemplate[] {
  const out: RewardTemplate[] = [];
  for (const item of items) {
    const derived = newRewardTemplate(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planRewardTemplate(item: RewardTemplate): number {
  return lenientLevelRecordWeight(8, true);
}
