import { FallbackWaitSummary } from "../../wait/bundle/fallback-wait-summary.js";
import { tieredWaitPlanBucket } from "../../wait/bundle/tiered-wait-plan-policy.js";
import { StepLedger, newStepLedger } from "./step-ledger.js";

export function summarizeFallbackWaitSummariesForLedger(items: FallbackWaitSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveStepLedgersFromSummary(items: FallbackWaitSummary[]): StepLedger[] {
  const out: StepLedger[] = [];
  for (const item of items) {
    const derived = newStepLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planStepLedger(item: StepLedger): string {
  return tieredWaitPlanBucket(item.adjustedLoad());
}
