import { normalizeApprovalPlanCode } from "../../approval/manifest/approval-plan-policy.js";
import { ApprovalPlan } from "../../approval/manifest/approval-plan.js";
import { MentionCheckpoint, newMentionCheckpoint } from "./mention-checkpoint.js";

export function summarizeApprovalPlansForCheckpoint(items: ApprovalPlan[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveMentionCheckpointsFromPlan(items: ApprovalPlan[]): MentionCheckpoint[] {
  const out: MentionCheckpoint[] = [];
  for (const item of items) {
    const derived = newMentionCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeMentionCheckpoint(item: MentionCheckpoint): string {
  return normalizeApprovalPlanCode(item.code);
}
