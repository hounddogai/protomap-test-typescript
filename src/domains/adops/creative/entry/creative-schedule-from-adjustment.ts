import { normalizePlacementAdjustmentCode } from "../../placement/adjustment/placement-adjustment-policy.js";
import { PlacementAdjustment } from "../../placement/adjustment/placement-adjustment.js";
import { CreativeSchedule, newCreativeSchedule } from "./creative-schedule.js";

export function summarizePlacementAdjustmentsForSchedule(items: PlacementAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveCreativeSchedulesFromAdjustment(items: PlacementAdjustment[]): CreativeSchedule[] {
  const out: CreativeSchedule[] = [];
  for (const item of items) {
    const derived = newCreativeSchedule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeCreativeSchedule(item: CreativeSchedule): string {
  return normalizePlacementAdjustmentCode(item.code);
}
