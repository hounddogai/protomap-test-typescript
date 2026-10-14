import { DefaultPostOverride } from "../../post/post-audit/default-post-override.js";
import { strictPostAuditBucket } from "../../post/post-audit/strict-post-audit-policy.js";
import { StrictMentionPlan, newStrictMentionPlan } from "./strict-mention-plan.js";

export function summarizeDefaultPostOverridesForPlan(items: DefaultPostOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictMentionPlansFromOverride(items: DefaultPostOverride[]): StrictMentionPlan[] {
  const out: StrictMentionPlan[] = [];
  for (const item of items) {
    const derived = newStrictMentionPlan(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateStrictMentionPlan(item: StrictMentionPlan): string {
  return strictPostAuditBucket(item.adjustedLoad());
}
