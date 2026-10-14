import { suppressionPolicyWeight } from "../../suppression/forecast/suppression-policy-policy.js";
import { SuppressionPolicy } from "../../suppression/forecast/suppression-policy.js";
import { OptOutAdjustment, newOptOutAdjustment } from "./opt-out-adjustment.js";

export function summarizeSuppressionPoliciesForAdjustment(items: SuppressionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveOptOutAdjustmentsFromPolicy(items: SuppressionPolicy[]): OptOutAdjustment[] {
  const out: OptOutAdjustment[] = [];
  for (const item of items) {
    const derived = newOptOutAdjustment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planOptOutAdjustment(item: OptOutAdjustment): number {
  return suppressionPolicyWeight(2, true);
}
