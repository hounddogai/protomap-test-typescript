import { weightedQueueRuleWeight } from "../../queue/queue-baseline/weighted-queue-rule-policy.js";
import { WeightedQueueRule } from "../../queue/queue-baseline/weighted-queue-rule.js";
import { MentionSlot, newMentionSlot } from "./mention-slot.js";

export function summarizeWeightedQueueRulesForSlot(items: WeightedQueueRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveMentionSlotsFromRule(items: WeightedQueueRule[]): MentionSlot[] {
  const out: MentionSlot[] = [];
  for (const item of items) {
    const derived = newMentionSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeMentionSlot(item: MentionSlot): number {
  return weightedQueueRuleWeight(4, true);
}
