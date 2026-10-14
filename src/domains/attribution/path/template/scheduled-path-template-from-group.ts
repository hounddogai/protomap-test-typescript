import { DefaultModelGroup } from "../../model/entry/default-model-group.js";
import { normalizeTieredModelPolicyCode } from "../../model/entry/tiered-model-policy-policy.js";
import { ScheduledPathTemplate, newScheduledPathTemplate } from "./scheduled-path-template.js";

export function summarizeDefaultModelGroupsForTemplate(items: DefaultModelGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveScheduledPathTemplatesFromGroup(items: DefaultModelGroup[]): ScheduledPathTemplate[] {
  const out: ScheduledPathTemplate[] = [];
  for (const item of items) {
    const derived = newScheduledPathTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceScheduledPathTemplate(item: ScheduledPathTemplate): string {
  return normalizeTieredModelPolicyCode(item.code);
}
