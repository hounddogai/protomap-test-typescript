import {
  classifyRollingLeaderboardTemplate,
} from "../../leaderboard/template/rolling-leaderboard-template-policy.js";
import { SeasonalLeaderboardSnapshot } from "../../leaderboard/template/seasonal-leaderboard-snapshot.js";
import { FraudCheckEstimate, newFraudCheckEstimate } from "./fraud-check-estimate.js";

export function summarizeSeasonalLeaderboardSnapshotsForEstimate(items: SeasonalLeaderboardSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveFraudCheckEstimatesFromSnapshot(items: SeasonalLeaderboardSnapshot[]): FraudCheckEstimate[] {
  const out: FraudCheckEstimate[] = [];
  for (const item of items) {
    const derived = newFraudCheckEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveFraudCheckEstimate(item: FraudCheckEstimate): string {
  return classifyRollingLeaderboardTemplate(item.effectiveVolume());
}
