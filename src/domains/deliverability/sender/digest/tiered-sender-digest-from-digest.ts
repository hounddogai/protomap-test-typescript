import { classifyReputationTier } from "../../reputation/reputation-claim/reputation-tier-policy.js";
import { SeasonalReputationDigest } from "../../reputation/reputation-claim/seasonal-reputation-digest.js";
import { TieredSenderDigest, newTieredSenderDigest } from "./tiered-sender-digest.js";

export function summarizeSeasonalReputationDigestsForDigest(items: SeasonalReputationDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTieredSenderDigestsFromDigest(items: SeasonalReputationDigest[]): TieredSenderDigest[] {
  const out: TieredSenderDigest[] = [];
  for (const item of items) {
    const derived = newTieredSenderDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeTieredSenderDigest(item: TieredSenderDigest): string {
  return classifyReputationTier(item.projectedExposure());
}
