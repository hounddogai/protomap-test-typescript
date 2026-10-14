import { SlaMilestone } from "../rollup/sla-milestone.js";
import { slaRollupWeight } from "../rollup/sla-rollup-policy.js";
import { SeasonalSlaDigest, newSeasonalSlaDigest } from "./seasonal-sla-digest.js";

export function summarizeSlaMilestonesForDigest(items: SlaMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveSeasonalSlaDigestsFromMilestone(items: SlaMilestone[]): SeasonalSlaDigest[] {
  const out: SeasonalSlaDigest[] = [];
  for (const item of items) {
    const derived = newSeasonalSlaDigest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function applySeasonalSlaDigest(item: SeasonalSlaDigest): number {
  return slaRollupWeight(4, true);
}
