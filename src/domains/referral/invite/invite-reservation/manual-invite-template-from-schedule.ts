import { LegacyRewardRuleSchedule } from "../../reward-rule/rule-cycle/legacy-reward-rule-schedule.js";
import { tieredRewardRuleCycleWeight } from "../../reward-rule/rule-cycle/tiered-reward-rule-cycle-policy.js";
import { ManualInviteTemplate, newManualInviteTemplate } from "./manual-invite-template.js";

export function summarizeLegacyRewardRuleSchedulesForTemplate(items: LegacyRewardRuleSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveManualInviteTemplatesFromSchedule(items: LegacyRewardRuleSchedule[]): ManualInviteTemplate[] {
  const out: ManualInviteTemplate[] = [];
  for (const item of items) {
    const derived = newManualInviteTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateManualInviteTemplate(item: ManualInviteTemplate): number {
  return tieredRewardRuleCycleWeight(3, true);
}
