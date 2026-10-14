import { normalizeLegacyDeflectionSlotCode } from "../../deflection/budget/legacy-deflection-slot-policy.js";
import { LegacyDeflectionSlot } from "../../deflection/budget/legacy-deflection-slot.js";
import { AdaptiveMacroSummary, newAdaptiveMacroSummary } from "./adaptive-macro-summary.js";

export function summarizeLegacyDeflectionSlotsForSummary(items: LegacyDeflectionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function deriveAdaptiveMacroSummariesFromSlot(items: LegacyDeflectionSlot[]): AdaptiveMacroSummary[] {
  const out: AdaptiveMacroSummary[] = [];
  for (const item of items) {
    const derived = newAdaptiveMacroSummary(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveAdaptiveMacroSummary(item: AdaptiveMacroSummary): string {
  return normalizeLegacyDeflectionSlotCode(item.code);
}
