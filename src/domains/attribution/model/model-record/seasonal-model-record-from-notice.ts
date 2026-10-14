import { primaryModelSlotWeight } from "../model-budget/primary-model-slot-policy.js";
import { RegionalModelNotice } from "../model-budget/regional-model-notice.js";
import { SeasonalModelRecord, newSeasonalModelRecord } from "./seasonal-model-record.js";

export function summarizeRegionalModelNoticesForRecord(items: RegionalModelNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveSeasonalModelRecordsFromNotice(items: RegionalModelNotice[]): SeasonalModelRecord[] {
  const out: SeasonalModelRecord[] = [];
  for (const item of items) {
    const derived = newSeasonalModelRecord(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planSeasonalModelRecord(item: SeasonalModelRecord): number {
  return primaryModelSlotWeight(2, true);
}
