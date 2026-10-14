import { OptOutRule } from "../../opt-out/score/opt-out-rule.js";
import { normalizeOptOutScoreCode } from "../../opt-out/score/opt-out-score-policy.js";
import { SuppressionSlot, newSuppressionSlot } from "./suppression-slot.js";

export function summarizeOptOutRulesForSlot(items: OptOutRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSuppressionSlotsFromRule(items: OptOutRule[]): SuppressionSlot[] {
  const out: SuppressionSlot[] = [];
  for (const item of items) {
    const derived = newSuppressionSlot(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function normalizeSuppressionSlot(item: SuppressionSlot): string {
  return normalizeOptOutScoreCode(item.code);
}
