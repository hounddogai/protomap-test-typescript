import { LenientRewardException } from "../../reward/baseline/lenient-reward-exception.js";
import { seasonalRewardCycleWeight } from "../../reward/baseline/seasonal-reward-cycle-policy.js";
import { LevelTemplate, newLevelTemplate } from "./level-template.js";

export function summarizeLenientRewardExceptionsForTemplate(items: LenientRewardException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveLevelTemplatesFromException(items: LenientRewardException[]): LevelTemplate[] {
  const out: LevelTemplate[] = [];
  for (const item of items) {
    const derived = newLevelTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyLevelTemplate(item: LevelTemplate): number {
  return seasonalRewardCycleWeight(7, true);
}
