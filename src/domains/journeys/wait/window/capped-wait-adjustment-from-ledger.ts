import { adaptiveExitRuleWindowBucket } from "../../exit-rule/bundle/adaptive-exit-rule-window-policy.js";
import { RollingExitRuleLedger } from "../../exit-rule/bundle/rolling-exit-rule-ledger.js";
import { CappedWaitAdjustment, newCappedWaitAdjustment } from "./capped-wait-adjustment.js";

export function summarizeRollingExitRuleLedgersForAdjustment(items: RollingExitRuleLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveCappedWaitAdjustmentsFromLedger(items: RollingExitRuleLedger[]): CappedWaitAdjustment[] {
  const out: CappedWaitAdjustment[] = [];
  for (const item of items) {
    const derived = newCappedWaitAdjustment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function planCappedWaitAdjustment(item: CappedWaitAdjustment): string {
  return adaptiveExitRuleWindowBucket(item.weightedValue());
}
