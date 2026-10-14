import { classifyTierException } from "../../tier/manual-tier-record/tier-exception-policy.js";
import { TierException } from "../../tier/manual-tier-record/tier-exception.js";
import { AdaptiveLeaderboardSegment, newAdaptiveLeaderboardSegment } from "./adaptive-leaderboard-segment.js";

export function summarizeTierExceptionsForSegment(items: TierException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveAdaptiveLeaderboardSegmentsFromException(items: TierException[]): AdaptiveLeaderboardSegment[] {
  const out: AdaptiveLeaderboardSegment[] = [];
  for (const item of items) {
    const derived = newAdaptiveLeaderboardSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptiveLeaderboardSegment(item: AdaptiveLeaderboardSegment): string {
  return classifyTierException(item.measuredValue());
}
