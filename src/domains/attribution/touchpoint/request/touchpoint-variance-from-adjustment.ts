import { PathAdjustment } from "../../path/rule/path-adjustment.js";
import { normalizePathRuleCode } from "../../path/rule/path-rule-policy.js";
import { TouchpointVariance, newTouchpointVariance } from "./touchpoint-variance.js";

export function summarizePathAdjustmentsForVariance(items: PathAdjustment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveTouchpointVariancesFromAdjustment(items: PathAdjustment[]): TouchpointVariance[] {
  const out: TouchpointVariance[] = [];
  for (const item of items) {
    const derived = newTouchpointVariance(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planTouchpointVariance(item: TouchpointVariance): string {
  return normalizePathRuleCode(item.code);
}
