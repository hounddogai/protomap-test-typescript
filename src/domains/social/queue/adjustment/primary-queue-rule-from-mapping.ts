import { mentionCheckpointWeight } from "../../mention/entry/mention-checkpoint-policy.js";
import { MentionMapping } from "../../mention/entry/mention-mapping.js";
import { PrimaryQueueRule, newPrimaryQueueRule } from "./primary-queue-rule.js";

export function summarizeMentionMappingsForRule(items: MentionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryQueueRulesFromMapping(items: MentionMapping[]): PrimaryQueueRule[] {
  const out: PrimaryQueueRule[] = [];
  for (const item of items) {
    const derived = newPrimaryQueueRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function computePrimaryQueueRule(item: PrimaryQueueRule): number {
  return mentionCheckpointWeight(4, true);
}
