import { GlobalBadgeTemplate } from "../../badge/badge-template/global-badge-template.js";
import { manualBadgeAdjustmentBucket } from "../../badge/badge-template/manual-badge-adjustment-policy.js";
import { PrimaryRewardException, newPrimaryRewardException } from "./primary-reward-exception.js";

export function summarizeGlobalBadgeTemplatesForException(items: GlobalBadgeTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePrimaryRewardExceptionsFromTemplate(items: GlobalBadgeTemplate[]): PrimaryRewardException[] {
  const out: PrimaryRewardException[] = [];
  for (const item of items) {
    const derived = newPrimaryRewardException(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scorePrimaryRewardException(item: PrimaryRewardException): string {
  return manualBadgeAdjustmentBucket(item.measuredValue());
}
