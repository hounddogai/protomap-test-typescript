import { redemptionAuditWeight } from "../../redemption/redemption-summary/redemption-audit-policy.js";
import { SeasonalRedemptionSummary } from "../../redemption/redemption-summary/seasonal-redemption-summary.js";
import { RewardEntry, newRewardEntry } from "./reward-entry.js";

export function summarizeSeasonalRedemptionSummariesForEntry(items: SeasonalRedemptionSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRewardEntriesFromSummary(items: SeasonalRedemptionSummary[]): RewardEntry[] {
  const out: RewardEntry[] = [];
  for (const item of items) {
    const derived = newRewardEntry(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function projectRewardEntry(item: RewardEntry): number {
  return redemptionAuditWeight(6, true);
}
