import { PayoutEstimate } from "../../payout/record-item/payout-estimate.js";
import { normalizePrimaryPayoutRecordCode } from "../../payout/record-item/primary-payout-record-policy.js";
import { SeasonalTierPolicy, newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

export function summarizePayoutEstimatesForPolicy(items: PayoutEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveSeasonalTierPoliciesFromEstimate(items: PayoutEstimate[]): SeasonalTierPolicy[] {
  const out: SeasonalTierPolicy[] = [];
  for (const item of items) {
    const derived = newSeasonalTierPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceSeasonalTierPolicy(item: SeasonalTierPolicy): string {
  return normalizePrimaryPayoutRecordCode(item.code);
}
