import { normalizeStrictStreakTemplateCode } from "../../streak/streak-profile/strict-streak-template-policy.js";
import { StrictStreakTemplate } from "../../streak/streak-profile/strict-streak-template.js";
import { CappedLevelCycle, newCappedLevelCycle } from "./capped-level-cycle.js";

export function summarizeStrictStreakTemplatesForCycle(items: StrictStreakTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveCappedLevelCyclesFromTemplate(items: StrictStreakTemplate[]): CappedLevelCycle[] {
  const out: CappedLevelCycle[] = [];
  for (const item of items) {
    const derived = newCappedLevelCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCappedLevelCycle(item: CappedLevelCycle): string {
  return normalizeStrictStreakTemplateCode(item.code);
}
