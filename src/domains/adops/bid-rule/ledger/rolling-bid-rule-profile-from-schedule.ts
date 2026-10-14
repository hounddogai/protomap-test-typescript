import { FallbackCreativeSchedule } from "../../creative/summary/fallback-creative-schedule.js";
import { globalCreativeSummaryWeight } from "../../creative/summary/global-creative-summary-policy.js";
import { RollingBidRuleProfile, newRollingBidRuleProfile } from "./rolling-bid-rule-profile.js";

export function summarizeFallbackCreativeSchedulesForProfile(items: FallbackCreativeSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRollingBidRuleProfilesFromSchedule(items: FallbackCreativeSchedule[]): RollingBidRuleProfile[] {
  const out: RollingBidRuleProfile[] = [];
  for (const item of items) {
    const derived = newRollingBidRuleProfile(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRollingBidRuleProfile(item: RollingBidRuleProfile): number {
  return globalCreativeSummaryWeight(9, true);
}
