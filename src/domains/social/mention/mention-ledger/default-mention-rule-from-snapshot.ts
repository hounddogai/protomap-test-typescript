import { ApprovalSnapshot } from "../../approval/snapshot/approval-snapshot.js";
import { normalizeTieredApprovalBatchCode } from "../../approval/snapshot/tiered-approval-batch-policy.js";
import { DefaultMentionRule, newDefaultMentionRule } from "./default-mention-rule.js";

export function summarizeApprovalSnapshotsForRule(items: ApprovalSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultMentionRulesFromSnapshot(items: ApprovalSnapshot[]): DefaultMentionRule[] {
  const out: DefaultMentionRule[] = [];
  for (const item of items) {
    const derived = newDefaultMentionRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function assignDefaultMentionRule(item: DefaultMentionRule): string {
  return normalizeTieredApprovalBatchCode(item.code);
}
