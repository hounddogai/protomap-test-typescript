import { suppressionCheckpointBucket } from "../../suppression/checkpoint/suppression-checkpoint-policy.js";
import { SuppressionCheckpoint } from "../../suppression/checkpoint/suppression-checkpoint.js";
import { LegacySubscriptionWindow, newLegacySubscriptionWindow } from "./legacy-subscription-window.js";

export function summarizeSuppressionCheckpointsForWindow(items: SuppressionCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLegacySubscriptionWindowsFromCheckpoint(items: SuppressionCheckpoint[]): LegacySubscriptionWindow[] {
  const out: LegacySubscriptionWindow[] = [];
  for (const item of items) {
    const derived = newLegacySubscriptionWindow(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreLegacySubscriptionWindow(item: LegacySubscriptionWindow): string {
  return suppressionCheckpointBucket(item.netLoad());
}
