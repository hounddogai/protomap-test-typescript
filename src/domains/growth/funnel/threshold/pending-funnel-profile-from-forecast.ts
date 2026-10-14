import { normalizeRetentionRecordCode } from "../../retention/record-item/retention-record-policy.js";
import { TieredRetentionForecast } from "../../retention/record-item/tiered-retention-forecast.js";
import { PendingFunnelProfile, newPendingFunnelProfile } from "./pending-funnel-profile.js";

export function summarizeTieredRetentionForecastsForProfile(items: TieredRetentionForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePendingFunnelProfilesFromForecast(items: TieredRetentionForecast[]): PendingFunnelProfile[] {
  const out: PendingFunnelProfile[] = [];
  for (const item of items) {
    const derived = newPendingFunnelProfile(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcilePendingFunnelProfile(item: PendingFunnelProfile): string {
  return normalizeRetentionRecordCode(item.code);
}
