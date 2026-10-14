import { normalizePrimaryDoubleOptInQuotaCode } from "../allocation/primary-double-opt-in-quota-policy.js";
import { SeasonalDoubleOptInBatch } from "../allocation/seasonal-double-opt-in-batch.js";
import { TieredDoubleOptInWindow, newTieredDoubleOptInWindow } from "./tiered-double-opt-in-window.js";

export function summarizeSeasonalDoubleOptInBatchesForWindow(items: SeasonalDoubleOptInBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveTieredDoubleOptInWindowsFromBatch(items: SeasonalDoubleOptInBatch[]): TieredDoubleOptInWindow[] {
  const out: TieredDoubleOptInWindow[] = [];
  for (const item of items) {
    const derived = newTieredDoubleOptInWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileTieredDoubleOptInWindow(item: TieredDoubleOptInWindow): string {
  return normalizePrimaryDoubleOptInQuotaCode(item.code);
}
