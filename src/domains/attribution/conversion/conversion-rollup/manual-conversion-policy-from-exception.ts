import { modelExceptionWeight } from "../../model/allocation/model-exception-policy.js";
import { ModelException } from "../../model/allocation/model-exception.js";
import { ManualConversionPolicy, newManualConversionPolicy } from "./manual-conversion-policy.js";

export function summarizeModelExceptionsForPolicy(items: ModelException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveManualConversionPoliciesFromException(items: ModelException[]): ManualConversionPolicy[] {
  const out: ManualConversionPolicy[] = [];
  for (const item of items) {
    const derived = newManualConversionPolicy(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planManualConversionPolicy(item: ManualConversionPolicy): number {
  return modelExceptionWeight(2, true);
}
