import { classifyBounceAssignment } from "../../bounce/request/bounce-assignment-policy.js";
import { BounceAssignment } from "../../bounce/request/bounce-assignment.js";
import { WarmupTarget, newWarmupTarget } from "./warmup-target.js";

export function summarizeBounceAssignmentsForTarget(items: BounceAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveWarmupTargetsFromAssignment(items: BounceAssignment[]): WarmupTarget[] {
  const out: WarmupTarget[] = [];
  for (const item of items) {
    const derived = newWarmupTarget(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignWarmupTarget(item: WarmupTarget): string {
  return classifyBounceAssignment(item.effectiveVolume());
}
