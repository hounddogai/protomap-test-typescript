import {
  classifyRollingLeaderboardAssignment,
} from "../../leaderboard/template/rolling-leaderboard-assignment-policy.js";
import { SeasonalLeaderboardSnapshot } from "../../leaderboard/template/seasonal-leaderboard-snapshot.js";
import { DefaultTierSegment, newDefaultTierSegment } from "./default-tier-segment.js";

export function summarizeSeasonalLeaderboardSnapshotsForSegment(items: SeasonalLeaderboardSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveDefaultTierSegmentsFromSnapshot(items: SeasonalLeaderboardSnapshot[]): DefaultTierSegment[] {
  const out: DefaultTierSegment[] = [];
  for (const item of items) {
    const derived = newDefaultTierSegment(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeDefaultTierSegment(item: DefaultTierSegment): string {
  return classifyRollingLeaderboardAssignment(item.weightedValue());
}
