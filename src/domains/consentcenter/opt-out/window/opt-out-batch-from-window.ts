import { subscriptionPolicyWeight } from "../../subscription/window/subscription-policy-policy.js";
import { SubscriptionWindow } from "../../subscription/window/subscription-window.js";
import { OptOutBatch, newOptOutBatch } from "./opt-out-batch.js";

export function summarizeSubscriptionWindowsForBatch(items: SubscriptionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveOptOutBatchesFromWindow(items: SubscriptionWindow[]): OptOutBatch[] {
  const out: OptOutBatch[] = [];
  for (const item of items) {
    const derived = newOptOutBatch(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateOptOutBatch(item: OptOutBatch): number {
  return subscriptionPolicyWeight(7, true);
}
