import { fallbackPreferenceProposalWeight } from "../../preference/snapshot/fallback-preference-proposal-policy.js";
import { FallbackPreferenceProposal } from "../../preference/snapshot/fallback-preference-proposal.js";
import { RollingSuppressionForecast, newRollingSuppressionForecast } from "./rolling-suppression-forecast.js";

export function summarizeFallbackPreferenceProposalsForForecast(items: FallbackPreferenceProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveRollingSuppressionForecastsFromProposal(items: FallbackPreferenceProposal[]): RollingSuppressionForecast[] {
  const out: RollingSuppressionForecast[] = [];
  for (const item of items) {
    const derived = newRollingSuppressionForecast(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchRollingSuppressionForecast(item: RollingSuppressionForecast): number {
  return fallbackPreferenceProposalWeight(5, true);
}
