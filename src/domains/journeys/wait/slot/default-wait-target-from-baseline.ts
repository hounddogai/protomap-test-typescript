import { normalizeCappedBranchPlanCode } from "../../branch/plan/capped-branch-plan-policy.js";
import { PendingBranchBaseline } from "../../branch/plan/pending-branch-baseline.js";
import { DefaultWaitTarget, newDefaultWaitTarget } from "./default-wait-target.js";

export function summarizePendingBranchBaselinesForTarget(items: PendingBranchBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveDefaultWaitTargetsFromBaseline(items: PendingBranchBaseline[]): DefaultWaitTarget[] {
  const out: DefaultWaitTarget[] = [];
  for (const item of items) {
    const derived = newDefaultWaitTarget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceDefaultWaitTarget(item: DefaultWaitTarget): string {
  return normalizeCappedBranchPlanCode(item.code);
}
