import { normalizeWeightedRewardForecastCode } from "../../reward/forecast/weighted-reward-forecast-policy.js";
import { WeightedRewardForecast } from "../../reward/forecast/weighted-reward-forecast.js";
import { RedemptionDraft, newRedemptionDraft } from "./redemption-draft.js";

export function summarizeWeightedRewardForecastsForDraft(items: WeightedRewardForecast[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRedemptionDraftsFromForecast(items: WeightedRewardForecast[]): RedemptionDraft[] {
  const out: RedemptionDraft[] = [];
  for (const item of items) {
    const derived = newRedemptionDraft(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignRedemptionDraft(item: RedemptionDraft): string {
  return normalizeWeightedRewardForecastCode(item.code);
}
