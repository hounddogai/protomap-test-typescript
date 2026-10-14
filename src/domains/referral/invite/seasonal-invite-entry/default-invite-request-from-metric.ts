import { lenientRewardRuleQuotaBucket } from "../../reward-rule/quota/lenient-reward-rule-quota-policy.js";
import { ManualRewardRuleMetric } from "../../reward-rule/quota/manual-reward-rule-metric.js";
import { DefaultInviteRequest, newDefaultInviteRequest } from "./default-invite-request.js";

export function summarizeManualRewardRuleMetricsForRequest(items: ManualRewardRuleMetric[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveDefaultInviteRequestsFromMetric(items: ManualRewardRuleMetric[]): DefaultInviteRequest[] {
  const out: DefaultInviteRequest[] = [];
  for (const item of items) {
    const derived = newDefaultInviteRequest(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyDefaultInviteRequest(item: DefaultInviteRequest): string {
  return lenientRewardRuleQuotaBucket(item.measuredValue());
}
