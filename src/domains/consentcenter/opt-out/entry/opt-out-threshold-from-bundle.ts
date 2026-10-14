import { StrictSubscriptionBundle } from "../../subscription/group/strict-subscription-bundle.js";
import { subscriptionBatchBucket } from "../../subscription/group/subscription-batch-policy.js";
import { OptOutThreshold, newOptOutThreshold } from "./opt-out-threshold.js";

export function summarizeStrictSubscriptionBundlesForThreshold(items: StrictSubscriptionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveOptOutThresholdsFromBundle(items: StrictSubscriptionBundle[]): OptOutThreshold[] {
  const out: OptOutThreshold[] = [];
  for (const item of items) {
    const derived = newOptOutThreshold(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitOptOutThreshold(item: OptOutThreshold): string {
  return subscriptionBatchBucket(item.measuredValue());
}
