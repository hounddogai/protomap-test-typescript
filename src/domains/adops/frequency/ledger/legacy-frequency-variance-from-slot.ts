import { GlobalCreativeSlot } from "../../creative/creative-slot/global-creative-slot.js";
import { normalizeManualCreativeLedgerCode } from "../../creative/creative-slot/manual-creative-ledger-policy.js";
import { LegacyFrequencyVariance, newLegacyFrequencyVariance } from "./legacy-frequency-variance.js";

export function summarizeGlobalCreativeSlotsForVariance(items: GlobalCreativeSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveLegacyFrequencyVariancesFromSlot(items: GlobalCreativeSlot[]): LegacyFrequencyVariance[] {
  const out: LegacyFrequencyVariance[] = [];
  for (const item of items) {
    const derived = newLegacyFrequencyVariance(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeLegacyFrequencyVariance(item: LegacyFrequencyVariance): string {
  return normalizeManualCreativeLedgerCode(item.code);
}
