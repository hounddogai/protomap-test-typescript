import { normalizeInsightOverrideCode } from "../../insight/slot/insight-override-policy.js";
import { InsightOverride } from "../../insight/slot/insight-override.js";
import { ApprovalCheckpoint, newApprovalCheckpoint } from "./approval-checkpoint.js";

export function summarizeInsightOverridesForCheckpoint(items: InsightOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveApprovalCheckpointsFromOverride(items: InsightOverride[]): ApprovalCheckpoint[] {
  const out: ApprovalCheckpoint[] = [];
  for (const item of items) {
    const derived = newApprovalCheckpoint(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeApprovalCheckpoint(item: ApprovalCheckpoint): string {
  return normalizeInsightOverrideCode(item.code);
}
