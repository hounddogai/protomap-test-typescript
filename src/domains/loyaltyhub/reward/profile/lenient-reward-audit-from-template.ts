import { classifyRewardTemplate } from "../preference/reward-template-policy.js";
import { RewardTemplate } from "../preference/reward-template.js";
import { LenientRewardAudit, newLenientRewardAudit } from "./lenient-reward-audit.js";

export function summarizeRewardTemplatesForAudit(items: RewardTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientRewardAuditsFromTemplate(items: RewardTemplate[]): LenientRewardAudit[] {
  const out: LenientRewardAudit[] = [];
  for (const item of items) {
    const derived = newLenientRewardAudit(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankLenientRewardAudit(item: LenientRewardAudit): string {
  return classifyRewardTemplate(item.effectiveValue());
}
