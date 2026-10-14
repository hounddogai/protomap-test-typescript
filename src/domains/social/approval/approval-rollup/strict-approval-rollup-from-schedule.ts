import { classifyMentionPlan } from "../../mention/rule/mention-plan-policy.js";
import { SeasonalMentionSchedule } from "../../mention/rule/seasonal-mention-schedule.js";
import { StrictApprovalRollup, newStrictApprovalRollup } from "./strict-approval-rollup.js";

export function summarizeSeasonalMentionSchedulesForRollup(items: SeasonalMentionSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStrictApprovalRollupsFromSchedule(items: SeasonalMentionSchedule[]): StrictApprovalRollup[] {
  const out: StrictApprovalRollup[] = [];
  for (const item of items) {
    const derived = newStrictApprovalRollup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchStrictApprovalRollup(item: StrictApprovalRollup): string {
  return classifyMentionPlan(item.projectedTotal());
}
