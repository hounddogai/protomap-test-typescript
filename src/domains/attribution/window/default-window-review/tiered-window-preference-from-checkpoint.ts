import {
  pendingConversionCheckpointWeight,
} from "../../conversion/default-conversion-slot/pending-conversion-checkpoint-policy.js";
import {
  PendingConversionCheckpoint,
} from "../../conversion/default-conversion-slot/pending-conversion-checkpoint.js";
import { TieredWindowPreference, newTieredWindowPreference } from "./tiered-window-preference.js";

export function summarizePendingConversionCheckpointsForPreference(items: PendingConversionCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveTieredWindowPreferencesFromCheckpoint(items: PendingConversionCheckpoint[]): TieredWindowPreference[] {
  const out: TieredWindowPreference[] = [];
  for (const item of items) {
    const derived = newTieredWindowPreference(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeTieredWindowPreference(item: TieredWindowPreference): number {
  return pendingConversionCheckpointWeight(9, true);
}
