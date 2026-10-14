import { domainProfileBucket } from "../../domain/metric/domain-profile-policy.js";
import { DomainProfile } from "../../domain/metric/domain-profile.js";
import { RollingSenderQuota, newRollingSenderQuota } from "./rolling-sender-quota.js";

export function summarizeDomainProfilesForQuota(items: DomainProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRollingSenderQuotasFromProfile(items: DomainProfile[]): RollingSenderQuota[] {
  const out: RollingSenderQuota[] = [];
  for (const item of items) {
    const derived = newRollingSenderQuota(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankRollingSenderQuota(item: RollingSenderQuota): string {
  return domainProfileBucket(item.netLoad());
}
