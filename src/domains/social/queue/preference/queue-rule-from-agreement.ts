import { ReplyAgreement } from "../../reply/override-item/reply-agreement.js";
import { replyOverrideBucket } from "../../reply/override-item/reply-override-policy.js";
import { QueueRule, newQueueRule } from "./queue-rule.js";

export function summarizeReplyAgreementsForRule(items: ReplyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveQueueRulesFromAgreement(items: ReplyAgreement[]): QueueRule[] {
  const out: QueueRule[] = [];
  for (const item of items) {
    const derived = newQueueRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveQueueRule(item: QueueRule): string {
  return replyOverrideBucket(item.effectiveTotal());
}
