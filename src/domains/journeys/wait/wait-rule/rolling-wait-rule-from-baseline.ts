import { normalizeWeightedWaitBaselineCode } from "../draft/weighted-wait-baseline-policy.js";
import { WeightedWaitBaseline } from "../draft/weighted-wait-baseline.js";
import { RollingWaitRule, newRollingWaitRule } from "./rolling-wait-rule.js";

export function summarizeWeightedWaitBaselinesForRule(items: WeightedWaitBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRollingWaitRulesFromBaseline(items: WeightedWaitBaseline[]): RollingWaitRule[] {
  const out: RollingWaitRule[] = [];
  for (const item of items) {
    const derived = newRollingWaitRule(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveRollingWaitRule(item: RollingWaitRule): string {
  return normalizeWeightedWaitBaselineCode(item.code);
}
