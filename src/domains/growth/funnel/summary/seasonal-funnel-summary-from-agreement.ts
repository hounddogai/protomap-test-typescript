import { globalNudgeForecastBucket } from "../../nudge/nudge-forecast/global-nudge-forecast-policy.js";
import { NudgeAgreement } from "../../nudge/nudge-forecast/nudge-agreement.js";
import { SeasonalFunnelSummary, newSeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

export function summarizeNudgeAgreementsForSummary(items: NudgeAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveSeasonalFunnelSummariesFromAgreement(items: NudgeAgreement[]): SeasonalFunnelSummary[] {
  const out: SeasonalFunnelSummary[] = [];
  for (const item of items) {
    const derived = newSeasonalFunnelSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateSeasonalFunnelSummary(item: SeasonalFunnelSummary): string {
  return globalNudgeForecastBucket(item.measuredValue());
}
