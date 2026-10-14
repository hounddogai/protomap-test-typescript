import { ManualFlightCheckpoint } from "../../flight/cycle/manual-flight-checkpoint.js";
import { normalizeRollingFlightScoreCode } from "../../flight/cycle/rolling-flight-score-policy.js";
import { TieredPlacementSlot, newTieredPlacementSlot } from "./tiered-placement-slot.js";

export function summarizeManualFlightCheckpointsForSlot(items: ManualFlightCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredPlacementSlotsFromCheckpoint(items: ManualFlightCheckpoint[]): TieredPlacementSlot[] {
  const out: TieredPlacementSlot[] = [];
  for (const item of items) {
    const derived = newTieredPlacementSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignTieredPlacementSlot(item: TieredPlacementSlot): string {
  return normalizeRollingFlightScoreCode(item.code);
}
