import { DefaultPreferenceNotice } from "../../preference/preference-schedule/default-preference-notice.js";
import {
  fallbackPreferenceRuleWeight,
} from "../../preference/preference-schedule/fallback-preference-rule-policy.js";
import { PendingOptOutProfile, newPendingOptOutProfile } from "./pending-opt-out-profile.js";

export function summarizeDefaultPreferenceNoticesForProfile(items: DefaultPreferenceNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePendingOptOutProfilesFromNotice(items: DefaultPreferenceNotice[]): PendingOptOutProfile[] {
  const out: PendingOptOutProfile[] = [];
  for (const item of items) {
    const derived = newPendingOptOutProfile(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignPendingOptOutProfile(item: PendingOptOutProfile): number {
  return fallbackPreferenceRuleWeight(8, true);
}
