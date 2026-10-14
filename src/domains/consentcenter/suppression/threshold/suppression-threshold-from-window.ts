import { LegacySubscriptionWindow } from "../../subscription/request/legacy-subscription-window.js";
import {
  normalizePendingSubscriptionSnapshotCode,
} from "../../subscription/request/pending-subscription-snapshot-policy.js";
import { SuppressionThreshold, newSuppressionThreshold } from "./suppression-threshold.js";

export function summarizeLegacySubscriptionWindowsForThreshold(items: LegacySubscriptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveSuppressionThresholdsFromWindow(items: LegacySubscriptionWindow[]): SuppressionThreshold[] {
  const out: SuppressionThreshold[] = [];
  for (const item of items) {
    const derived = newSuppressionThreshold(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankSuppressionThreshold(item: SuppressionThreshold): string {
  return normalizePendingSubscriptionSnapshotCode(item.code);
}
