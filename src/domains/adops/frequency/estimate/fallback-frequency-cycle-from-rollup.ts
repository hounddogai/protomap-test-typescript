import { lenientCreativeRollupWeight } from "../../creative/creative-ledger/lenient-creative-rollup-policy.js";
import { LenientCreativeRollup } from "../../creative/creative-ledger/lenient-creative-rollup.js";
import { FallbackFrequencyCycle, newFallbackFrequencyCycle } from "./fallback-frequency-cycle.js";

export function summarizeLenientCreativeRollupsForCycle(items: LenientCreativeRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveFallbackFrequencyCyclesFromRollup(items: LenientCreativeRollup[]): FallbackFrequencyCycle[] {
  const out: FallbackFrequencyCycle[] = [];
  for (const item of items) {
    const derived = newFallbackFrequencyCycle(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveFallbackFrequencyCycle(item: FallbackFrequencyCycle): number {
  return lenientCreativeRollupWeight(5, true);
}
