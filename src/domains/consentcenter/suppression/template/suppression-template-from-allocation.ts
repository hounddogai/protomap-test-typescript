import { optOutAllocationBucket } from "../../opt-out/baseline/opt-out-allocation-policy.js";
import { OptOutAllocation } from "../../opt-out/baseline/opt-out-allocation.js";
import { SuppressionTemplate, newSuppressionTemplate } from "./suppression-template.js";

export function summarizeOptOutAllocationsForTemplate(items: OptOutAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSuppressionTemplatesFromAllocation(items: OptOutAllocation[]): SuppressionTemplate[] {
  const out: SuppressionTemplate[] = [];
  for (const item of items) {
    const derived = newSuppressionTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleSuppressionTemplate(item: SuppressionTemplate): string {
  return optOutAllocationBucket(item.adjustedLoad());
}
