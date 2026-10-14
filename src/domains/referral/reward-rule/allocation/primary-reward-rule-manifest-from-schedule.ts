import { normalizeTieredInviteScheduleCode } from "../../invite/digest/tiered-invite-schedule-policy.js";
import { TieredInviteSchedule } from "../../invite/digest/tiered-invite-schedule.js";
import { PrimaryRewardRuleManifest, newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

export function summarizeTieredInviteSchedulesForManifest(items: TieredInviteSchedule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePrimaryRewardRuleManifestsFromSchedule(items: TieredInviteSchedule[]): PrimaryRewardRuleManifest[] {
  const out: PrimaryRewardRuleManifest[] = [];
  for (const item of items) {
    const derived = newPrimaryRewardRuleManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizePrimaryRewardRuleManifest(item: PrimaryRewardRuleManifest): string {
  return normalizeTieredInviteScheduleCode(item.code);
}
