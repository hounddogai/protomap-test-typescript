import { normalizePendingBidRulePlanCode } from "../../bid-rule/cycle/pending-bid-rule-plan-policy.js";
import { RollingBidRuleSchedule } from "../../bid-rule/cycle/rolling-bid-rule-schedule.js";
import { ScheduledCreativePreference, newScheduledCreativePreference } from "./scheduled-creative-preference.js";

export function summarizeRollingBidRuleSchedulesForPreference(items: RollingBidRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveScheduledCreativePreferencesFromSchedule(items: RollingBidRuleSchedule[]): ScheduledCreativePreference[] {
  const out: ScheduledCreativePreference[] = [];
  for (const item of items) {
    const derived = newScheduledCreativePreference(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyScheduledCreativePreference(item: ScheduledCreativePreference): string {
  return normalizePendingBidRulePlanCode(item.code);
}
