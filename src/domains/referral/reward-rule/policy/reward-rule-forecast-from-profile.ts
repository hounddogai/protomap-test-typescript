import { InviteProfile } from "../../invite/segment/invite-profile.js";
import { inviteThresholdWeight } from "../../invite/segment/invite-threshold-policy.js";
import { RewardRuleForecast, newRewardRuleForecast } from "./reward-rule-forecast.js";

export function summarizeInviteProfilesForForecast(items: InviteProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveRewardRuleForecastsFromProfile(items: InviteProfile[]): RewardRuleForecast[] {
  const out: RewardRuleForecast[] = [];
  for (const item of items) {
    const derived = newRewardRuleForecast(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitRewardRuleForecast(item: RewardRuleForecast): number {
  return inviteThresholdWeight(3, true);
}
