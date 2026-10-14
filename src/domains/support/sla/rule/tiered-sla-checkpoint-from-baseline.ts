import { classifyCappedMacroEstimate } from "../../macro/policy/capped-macro-estimate-policy.js";
import { PendingMacroBaseline } from "../../macro/policy/pending-macro-baseline.js";
import { TieredSlaCheckpoint, newTieredSlaCheckpoint } from "./tiered-sla-checkpoint.js";

export function summarizePendingMacroBaselinesForCheckpoint(items: PendingMacroBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveTieredSlaCheckpointsFromBaseline(items: PendingMacroBaseline[]): TieredSlaCheckpoint[] {
  const out: TieredSlaCheckpoint[] = [];
  for (const item of items) {
    const derived = newTieredSlaCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyTieredSlaCheckpoint(item: TieredSlaCheckpoint): string {
  return classifyCappedMacroEstimate(item.effectiveLoad());
}
