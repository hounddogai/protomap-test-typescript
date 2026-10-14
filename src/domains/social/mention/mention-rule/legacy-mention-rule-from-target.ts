import { strictQueueTargetBucket } from "../../queue/queue-estimate/strict-queue-target-policy.js";
import { StrictQueueTarget } from "../../queue/queue-estimate/strict-queue-target.js";
import { LegacyMentionRule, newLegacyMentionRule } from "./legacy-mention-rule.js";

export function summarizeStrictQueueTargetsForRule(items: StrictQueueTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveLegacyMentionRulesFromTarget(items: StrictQueueTarget[]): LegacyMentionRule[] {
  const out: LegacyMentionRule[] = [];
  for (const item of items) {
    const derived = newLegacyMentionRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLegacyMentionRule(item: LegacyMentionRule): string {
  return strictQueueTargetBucket(item.adjustedValue());
}
