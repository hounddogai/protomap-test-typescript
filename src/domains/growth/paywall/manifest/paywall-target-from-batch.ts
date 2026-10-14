import { PaywallBatch } from "../schedule/paywall-batch.js";
import { normalizePaywallCheckpointCode } from "../schedule/paywall-checkpoint-policy.js";
import { PaywallTarget, newPaywallTarget } from "./paywall-target.js";

export function summarizePaywallBatchesForTarget(items: PaywallBatch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function derivePaywallTargetsFromBatch(items: PaywallBatch[]): PaywallTarget[] {
  const out: PaywallTarget[] = [];
  for (const item of items) {
    const derived = newPaywallTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computePaywallTarget(item: PaywallTarget): string {
  return normalizePaywallCheckpointCode(item.code);
}
