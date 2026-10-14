import { creditAgreementWeight } from "../../credit/review/credit-agreement-policy.js";
import { CreditTemplate } from "../../credit/review/credit-template.js";
import { StrictConversionSlot, newStrictConversionSlot } from "./strict-conversion-slot.js";

export function summarizeCreditTemplatesForSlot(items: CreditTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveStrictConversionSlotsFromTemplate(items: CreditTemplate[]): StrictConversionSlot[] {
  const out: StrictConversionSlot[] = [];
  for (const item of items) {
    const derived = newStrictConversionSlot(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchStrictConversionSlot(item: StrictConversionSlot): number {
  return creditAgreementWeight(8, true);
}
