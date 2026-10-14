import { TieredDeflectionSlot } from "../../deflection/variance/tiered-deflection-slot.js";
import { classifyTieredDeflectionThreshold } from "../../deflection/variance/tiered-deflection-threshold-policy.js";
import { PrimaryCsatTarget, newPrimaryCsatTarget } from "./primary-csat-target.js";

export function summarizeTieredDeflectionSlotsForTarget(items: TieredDeflectionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function derivePrimaryCsatTargetsFromSlot(items: TieredDeflectionSlot[]): PrimaryCsatTarget[] {
  const out: PrimaryCsatTarget[] = [];
  for (const item of items) {
    const derived = newPrimaryCsatTarget(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitPrimaryCsatTarget(item: PrimaryCsatTarget): string {
  return classifyTieredDeflectionThreshold(item.effectiveValue());
}
