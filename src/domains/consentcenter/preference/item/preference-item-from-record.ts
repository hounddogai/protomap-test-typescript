import { CappedSuppressionRecord } from "../../suppression/suppression-request/capped-suppression-record.js";
import {
  normalizeRollingSuppressionThresholdCode,
} from "../../suppression/suppression-request/rolling-suppression-threshold-policy.js";
import { PreferenceItem, newPreferenceItem } from "./preference-item.js";

export function summarizeCappedSuppressionRecordsForItem(items: CappedSuppressionRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function derivePreferenceItemsFromRecord(items: CappedSuppressionRecord[]): PreferenceItem[] {
  const out: PreferenceItem[] = [];
  for (const item of items) {
    const derived = newPreferenceItem(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePreferenceItem(item: PreferenceItem): string {
  return normalizeRollingSuppressionThresholdCode(item.code);
}
