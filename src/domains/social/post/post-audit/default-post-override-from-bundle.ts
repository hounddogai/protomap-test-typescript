import { QueueBundle } from "../../queue/bundle/queue-bundle.js";
import { regionalQueueProfileWeight } from "../../queue/bundle/regional-queue-profile-policy.js";
import { DefaultPostOverride, newDefaultPostOverride } from "./default-post-override.js";

export function summarizeQueueBundlesForOverride(items: QueueBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveDefaultPostOverridesFromBundle(items: QueueBundle[]): DefaultPostOverride[] {
  const out: DefaultPostOverride[] = [];
  for (const item of items) {
    const derived = newDefaultPostOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceDefaultPostOverride(item: DefaultPostOverride): number {
  return regionalQueueProfileWeight(1, true);
}
