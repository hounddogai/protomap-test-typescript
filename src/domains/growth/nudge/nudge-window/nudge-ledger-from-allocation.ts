import { classifyActivationMetric } from "../../activation/activation-allocation/activation-metric-policy.js";
import {
  FallbackActivationAllocation,
} from "../../activation/activation-allocation/fallback-activation-allocation.js";
import { NudgeLedger, newNudgeLedger } from "./nudge-ledger.js";

export function summarizeFallbackActivationAllocationsForLedger(items: FallbackActivationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveNudgeLedgersFromAllocation(items: FallbackActivationAllocation[]): NudgeLedger[] {
  const out: NudgeLedger[] = [];
  for (const item of items) {
    const derived = newNudgeLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitNudgeLedger(item: NudgeLedger): string {
  return classifyActivationMetric(item.adjustedExposure());
}
