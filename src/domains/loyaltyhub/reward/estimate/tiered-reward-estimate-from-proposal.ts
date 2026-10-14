import { redemptionPreferenceWeight } from "../../redemption/preference/redemption-preference-policy.js";
import { RegionalRedemptionProposal } from "../../redemption/preference/regional-redemption-proposal.js";
import { TieredRewardEstimate, newTieredRewardEstimate } from "./tiered-reward-estimate.js";

export function summarizeRegionalRedemptionProposalsForEstimate(items: RegionalRedemptionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveTieredRewardEstimatesFromProposal(items: RegionalRedemptionProposal[]): TieredRewardEstimate[] {
  const out: TieredRewardEstimate[] = [];
  for (const item of items) {
    const derived = newTieredRewardEstimate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileTieredRewardEstimate(item: TieredRewardEstimate): number {
  return redemptionPreferenceWeight(2, true);
}
