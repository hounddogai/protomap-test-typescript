import { classifyWaitEstimate } from "../../wait/wait-budget/wait-estimate-policy.js";
import { WaitEstimate } from "../../wait/wait-budget/wait-estimate.js";
import { RollingExitRuleLedger, newRollingExitRuleLedger } from "./rolling-exit-rule-ledger.js";

export function summarizeWaitEstimatesForLedger(items: WaitEstimate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveRollingExitRuleLedgersFromEstimate(items: WaitEstimate[]): RollingExitRuleLedger[] {
  const out: RollingExitRuleLedger[] = [];
  for (const item of items) {
    const derived = newRollingExitRuleLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeRollingExitRuleLedger(item: RollingExitRuleLedger): string {
  return classifyWaitEstimate(item.weightedLoad());
}
