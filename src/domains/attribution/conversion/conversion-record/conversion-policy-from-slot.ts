import { strictConversionSlotWeight } from "../conversion-slot/strict-conversion-slot-policy.js";
import { StrictConversionSlot } from "../conversion-slot/strict-conversion-slot.js";
import { ConversionPolicy, newConversionPolicy } from "./conversion-policy.js";

export function summarizeStrictConversionSlotsForPolicy(items: StrictConversionSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveConversionPoliciesFromSlot(items: StrictConversionSlot[]): ConversionPolicy[] {
  const out: ConversionPolicy[] = [];
  for (const item of items) {
    const derived = newConversionPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignConversionPolicy(item: ConversionPolicy): number {
  return strictConversionSlotWeight(3, true);
}
