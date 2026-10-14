import { WarmupAssignment } from "../../warmup/threshold/warmup-assignment.js";
import { classifyWarmupRule } from "../../warmup/threshold/warmup-rule-policy.js";
import { BounceNotice, newBounceNotice } from "./bounce-notice.js";

export function summarizeWarmupAssignmentsForNotice(items: WarmupAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveBounceNoticesFromAssignment(items: WarmupAssignment[]): BounceNotice[] {
  const out: BounceNotice[] = [];
  for (const item of items) {
    const derived = newBounceNotice(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveBounceNotice(item: BounceNotice): string {
  return classifyWarmupRule(item.projectedValue());
}
