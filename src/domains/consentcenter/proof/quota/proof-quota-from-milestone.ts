import { preferenceNoticeWeight } from "../../preference/notice/preference-notice-policy.js";
import { StrictPreferenceMilestone } from "../../preference/notice/strict-preference-milestone.js";
import { ProofQuota, newProofQuota } from "./proof-quota.js";

export function summarizeStrictPreferenceMilestonesForQuota(items: StrictPreferenceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveProofQuotasFromMilestone(items: StrictPreferenceMilestone[]): ProofQuota[] {
  const out: ProofQuota[] = [];
  for (const item of items) {
    const derived = newProofQuota(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveProofQuota(item: ProofQuota): number {
  return preferenceNoticeWeight(1, true);
}
