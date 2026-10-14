import { ConversionBundle } from "../threshold/conversion-bundle.js";
import { classifyConversionSegment } from "../threshold/conversion-segment-policy.js";
import { RegionalConversionSlot, newRegionalConversionSlot } from "./regional-conversion-slot.js";

export function summarizeConversionBundlesForSlot(items: ConversionBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRegionalConversionSlotsFromBundle(items: ConversionBundle[]): RegionalConversionSlot[] {
  const out: RegionalConversionSlot[] = [];
  for (const item of items) {
    const derived = newRegionalConversionSlot(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRegionalConversionSlot(item: RegionalConversionSlot): string {
  return classifyConversionSegment(item.netExposure());
}
