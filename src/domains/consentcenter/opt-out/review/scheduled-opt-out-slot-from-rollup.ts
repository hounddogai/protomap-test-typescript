import { FallbackPreferenceRollup } from "../../preference/tier/fallback-preference-rollup.js";
import { normalizePreferenceEstimateCode } from "../../preference/tier/preference-estimate-policy.js";
import { ScheduledOptOutSlot, newScheduledOptOutSlot } from "./scheduled-opt-out-slot.js";

export function summarizeFallbackPreferenceRollupsForSlot(items: FallbackPreferenceRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveScheduledOptOutSlotsFromRollup(items: FallbackPreferenceRollup[]): ScheduledOptOutSlot[] {
  const out: ScheduledOptOutSlot[] = [];
  for (const item of items) {
    const derived = newScheduledOptOutSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveScheduledOptOutSlot(item: ScheduledOptOutSlot): string {
  return normalizePreferenceEstimateCode(item.code);
}
