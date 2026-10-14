import { normalizeCappedMentionThresholdCode } from "../../mention/mention-cycle/capped-mention-threshold-policy.js";
import { CappedMentionThreshold } from "../../mention/mention-cycle/capped-mention-threshold.js";
import { FallbackQueueAdjustment, newFallbackQueueAdjustment } from "./fallback-queue-adjustment.js";

export function summarizeCappedMentionThresholdsForAdjustment(items: CappedMentionThreshold[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveFallbackQueueAdjustmentsFromThreshold(items: CappedMentionThreshold[]): FallbackQueueAdjustment[] {
  const out: FallbackQueueAdjustment[] = [];
  for (const item of items) {
    const derived = newFallbackQueueAdjustment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleFallbackQueueAdjustment(item: FallbackQueueAdjustment): string {
  return normalizeCappedMentionThresholdCode(item.code);
}
