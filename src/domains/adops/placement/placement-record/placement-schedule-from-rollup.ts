import { classifyDefaultPlacementEstimate } from "../placement-group/default-placement-estimate-policy.js";
import { TieredPlacementRollup } from "../placement-group/tiered-placement-rollup.js";
import { PlacementSchedule, newPlacementSchedule } from "./placement-schedule.js";

export function summarizeTieredPlacementRollupsForSchedule(items: TieredPlacementRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function derivePlacementSchedulesFromRollup(items: TieredPlacementRollup[]): PlacementSchedule[] {
  const out: PlacementSchedule[] = [];
  for (const item of items) {
    const derived = newPlacementSchedule(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planPlacementSchedule(item: PlacementSchedule): string {
  return classifyDefaultPlacementEstimate(item.effectiveExposure());
}
