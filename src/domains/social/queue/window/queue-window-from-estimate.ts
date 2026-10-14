import { normalizeLegacyQueueEstimateCode } from "../estimate/legacy-queue-estimate-policy.js";
import { LegacyQueueEstimate } from "../estimate/legacy-queue-estimate.js";
import { QueueWindow, newQueueWindow } from "./queue-window.js";

export function summarizeLegacyQueueEstimatesForWindow(items: LegacyQueueEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedTotal());
  }
  return totals;
}

export function deriveQueueWindowsFromEstimate(items: LegacyQueueEstimate[]): QueueWindow[] {
  const out: QueueWindow[] = [];
  for (const item of items) {
    const derived = newQueueWindow(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeQueueWindow(item: QueueWindow): string {
  return normalizeLegacyQueueEstimateCode(item.code);
}
