import { escalationAdjustmentWeight } from "../metric/escalation-adjustment-policy.js";
import { EscalationRollup } from "../metric/escalation-rollup.js";
import { EscalationWindow, newEscalationWindow } from "./escalation-window.js";

export function summarizeEscalationRollupsForWindow(items: EscalationRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveEscalationWindowsFromRollup(items: EscalationRollup[]): EscalationWindow[] {
  const out: EscalationWindow[] = [];
  for (const item of items) {
    const derived = newEscalationWindow(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateEscalationWindow(item: EscalationWindow): number {
  return escalationAdjustmentWeight(2, true);
}
