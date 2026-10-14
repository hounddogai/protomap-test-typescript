import { QueueGroup } from "../../queue/record-item/queue-group.js";
import { classifyWeightedQueueEstimate } from "../../queue/record-item/weighted-queue-estimate-policy.js";
import { LegacyMentionGroup, newLegacyMentionGroup } from "./legacy-mention-group.js";

export function summarizeQueueGroupsForGroup(items: QueueGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveLegacyMentionGroupsFromGroup(items: QueueGroup[]): LegacyMentionGroup[] {
  const out: LegacyMentionGroup[] = [];
  for (const item of items) {
    const derived = newLegacyMentionGroup(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLegacyMentionGroup(item: LegacyMentionGroup): string {
  return classifyWeightedQueueEstimate(item.adjustedValue());
}
