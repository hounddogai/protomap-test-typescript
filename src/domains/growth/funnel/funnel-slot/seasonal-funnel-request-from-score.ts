import { RetentionScore } from "../../retention/score/retention-score.js";
import { scheduledRetentionScoreBucket } from "../../retention/score/scheduled-retention-score-policy.js";
import { SeasonalFunnelRequest, newSeasonalFunnelRequest } from "./seasonal-funnel-request.js";

export function summarizeRetentionScoresForRequest(items: RetentionScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveSeasonalFunnelRequestsFromScore(items: RetentionScore[]): SeasonalFunnelRequest[] {
  const out: SeasonalFunnelRequest[] = [];
  for (const item of items) {
    const derived = newSeasonalFunnelRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignSeasonalFunnelRequest(item: SeasonalFunnelRequest): string {
  return scheduledRetentionScoreBucket(item.projectedExposure());
}
