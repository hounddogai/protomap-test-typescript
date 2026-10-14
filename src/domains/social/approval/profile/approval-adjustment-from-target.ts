import { normalizeFallbackQueueThresholdCode } from "../../queue/score/fallback-queue-threshold-policy.js";
import { RollingQueueTarget } from "../../queue/score/rolling-queue-target.js";
import { ApprovalAdjustment, newApprovalAdjustment } from "./approval-adjustment.js";

export function summarizeRollingQueueTargetsForAdjustment(items: RollingQueueTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveApprovalAdjustmentsFromTarget(items: RollingQueueTarget[]): ApprovalAdjustment[] {
  const out: ApprovalAdjustment[] = [];
  for (const item of items) {
    const derived = newApprovalAdjustment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceApprovalAdjustment(item: ApprovalAdjustment): string {
  return normalizeFallbackQueueThresholdCode(item.code);
}
