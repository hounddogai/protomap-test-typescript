import { AdaptiveOptOutQuota } from "../../opt-out/out-baseline/adaptive-opt-out-quota.js";
import { normalizeBatchedOptOutBaselineCode } from "../../opt-out/out-baseline/batched-opt-out-baseline-policy.js";
import { RollingPreferenceCycle, newRollingPreferenceCycle } from "./rolling-preference-cycle.js";

export function summarizeAdaptiveOptOutQuotasForCycle(items: AdaptiveOptOutQuota[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingPreferenceCyclesFromQuota(items: AdaptiveOptOutQuota[]): RollingPreferenceCycle[] {
  const out: RollingPreferenceCycle[] = [];
  for (const item of items) {
    const derived = newRollingPreferenceCycle(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchRollingPreferenceCycle(item: RollingPreferenceCycle): string {
  return normalizeBatchedOptOutBaselineCode(item.code);
}
