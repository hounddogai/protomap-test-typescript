import { pendingWaitSummaryWeight } from "../../wait/metric/pending-wait-summary-policy.js";
import { SeasonalWaitTier } from "../../wait/metric/seasonal-wait-tier.js";
import { PrimaryStepWindow, newPrimaryStepWindow } from "./primary-step-window.js";

export function summarizeSeasonalWaitTiersForWindow(items: SeasonalWaitTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePrimaryStepWindowsFromTier(items: SeasonalWaitTier[]): PrimaryStepWindow[] {
  const out: PrimaryStepWindow[] = [];
  for (const item of items) {
    const derived = newPrimaryStepWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computePrimaryStepWindow(item: PrimaryStepWindow): number {
  return pendingWaitSummaryWeight(1, true);
}
