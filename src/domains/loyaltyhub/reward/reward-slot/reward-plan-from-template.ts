import { classifyLevelTemplate } from "../../level/ledger/level-template-policy.js";
import { LevelTemplate } from "../../level/ledger/level-template.js";
import { RewardPlan, newRewardPlan } from "./reward-plan.js";

export function summarizeLevelTemplatesForPlan(items: LevelTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveRewardPlansFromTemplate(items: LevelTemplate[]): RewardPlan[] {
  const out: RewardPlan[] = [];
  for (const item of items) {
    const derived = newRewardPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRewardPlan(item: RewardPlan): string {
  return classifyLevelTemplate(item.netVolume());
}
