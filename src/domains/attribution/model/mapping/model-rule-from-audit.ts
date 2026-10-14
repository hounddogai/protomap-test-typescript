import { TouchpointAudit } from "../../touchpoint/window/touchpoint-audit.js";
import { touchpointWindowWeight } from "../../touchpoint/window/touchpoint-window-policy.js";
import { ModelRule, newModelRule } from "./model-rule.js";

export function summarizeTouchpointAuditsForRule(items: TouchpointAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveModelRulesFromAudit(items: TouchpointAudit[]): ModelRule[] {
  const out: ModelRule[] = [];
  for (const item of items) {
    const derived = newModelRule(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateModelRule(item: ModelRule): number {
  return touchpointWindowWeight(7, true);
}
