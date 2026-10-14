import { pacingRollupWeight } from "../../pacing/rollup/pacing-rollup-policy.js";
import { StrictPacingRollup } from "../../pacing/rollup/strict-pacing-rollup.js";
import { PlacementMilestone, newPlacementMilestone } from "./placement-milestone.js";

export function summarizeStrictPacingRollupsForMilestone(items: StrictPacingRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePlacementMilestonesFromRollup(items: StrictPacingRollup[]): PlacementMilestone[] {
  const out: PlacementMilestone[] = [];
  for (const item of items) {
    const derived = newPlacementMilestone(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settlePlacementMilestone(item: PlacementMilestone): number {
  return pacingRollupWeight(6, true);
}
