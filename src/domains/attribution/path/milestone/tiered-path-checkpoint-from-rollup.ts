import { ConversionRollup } from "../../conversion/rollup/conversion-rollup.js";
import { primaryConversionCycleWeight } from "../../conversion/rollup/primary-conversion-cycle-policy.js";
import { TieredPathCheckpoint, newTieredPathCheckpoint } from "./tiered-path-checkpoint.js";

export function summarizeConversionRollupsForCheckpoint(items: ConversionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTieredPathCheckpointsFromRollup(items: ConversionRollup[]): TieredPathCheckpoint[] {
  const out: TieredPathCheckpoint[] = [];
  for (const item of items) {
    const derived = newTieredPathCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyTieredPathCheckpoint(item: TieredPathCheckpoint): number {
  return primaryConversionCycleWeight(9, true);
}
