import { classifyBadgeTemplate } from "../../badge/template/badge-template-policy.js";
import { BadgeTemplate } from "../../badge/template/badge-template.js";
import { StreakGroup, newStreakGroup } from "./streak-group.js";

export function summarizeBadgeTemplatesForGroup(items: BadgeTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveStreakGroupsFromTemplate(items: BadgeTemplate[]): StreakGroup[] {
  const out: StreakGroup[] = [];
  for (const item of items) {
    const derived = newStreakGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStreakGroup(item: StreakGroup): string {
  return classifyBadgeTemplate(item.measuredValue());
}
