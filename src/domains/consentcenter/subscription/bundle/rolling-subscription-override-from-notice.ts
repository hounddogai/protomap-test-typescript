import { classifyPreferenceNotice } from "../../preference/notice/preference-notice-policy.js";
import { PreferenceNotice } from "../../preference/notice/preference-notice.js";
import { RollingSubscriptionOverride, newRollingSubscriptionOverride } from "./rolling-subscription-override.js";

export function summarizePreferenceNoticesForOverride(items: PreferenceNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingSubscriptionOverridesFromNotice(items: PreferenceNotice[]): RollingSubscriptionOverride[] {
  const out: RollingSubscriptionOverride[] = [];
  for (const item of items) {
    const derived = newRollingSubscriptionOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeRollingSubscriptionOverride(item: RollingSubscriptionOverride): string {
  return classifyPreferenceNotice(item.effectiveValue());
}
