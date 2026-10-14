import { classifyDefaultRedemptionVariance } from "../../redemption/window/default-redemption-variance-policy.js";
import { RedemptionGroup } from "../../redemption/window/redemption-group.js";
import { StreakTemplate, newStreakTemplate } from "./streak-template.js";

export function summarizeRedemptionGroupsForTemplate(items: RedemptionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveStreakTemplatesFromGroup(items: RedemptionGroup[]): StreakTemplate[] {
  const out: StreakTemplate[] = [];
  for (const item of items) {
    const derived = newStreakTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeStreakTemplate(item: StreakTemplate): string {
  return classifyDefaultRedemptionVariance(item.projectedVolume());
}
