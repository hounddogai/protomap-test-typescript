import { defaultApprovalTierBucket } from "../../approval/approval-rollup/default-approval-tier-policy.js";
import { DefaultApprovalTier } from "../../approval/approval-rollup/default-approval-tier.js";
import { ReplyCycle, newReplyCycle } from "./reply-cycle.js";

export function summarizeDefaultApprovalTiersForCycle(items: DefaultApprovalTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveReplyCyclesFromTier(items: DefaultApprovalTier[]): ReplyCycle[] {
  const out: ReplyCycle[] = [];
  for (const item of items) {
    const derived = newReplyCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveReplyCycle(item: ReplyCycle): string {
  return defaultApprovalTierBucket(item.effectiveLoad());
}
