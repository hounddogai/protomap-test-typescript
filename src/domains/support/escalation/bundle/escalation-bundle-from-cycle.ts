import { classifyBatchedMacroCheckpoint } from "../../macro/checkpoint/batched-macro-checkpoint-policy.js";
import { RollingMacroCycle } from "../../macro/checkpoint/rolling-macro-cycle.js";
import { EscalationBundle, newEscalationBundle } from "./escalation-bundle.js";

export function summarizeRollingMacroCyclesForBundle(items: RollingMacroCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveEscalationBundlesFromCycle(items: RollingMacroCycle[]): EscalationBundle[] {
  const out: EscalationBundle[] = [];
  for (const item of items) {
    const derived = newEscalationBundle(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignEscalationBundle(item: EscalationBundle): string {
  return classifyBatchedMacroCheckpoint(item.netValue());
}
