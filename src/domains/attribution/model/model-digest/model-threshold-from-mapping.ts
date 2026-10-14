import {
  classifyDefaultConversionAgreement,
} from "../../conversion/conversion-batch/default-conversion-agreement-policy.js";
import { PrimaryConversionMapping } from "../../conversion/conversion-batch/primary-conversion-mapping.js";
import { ModelThreshold, newModelThreshold } from "./model-threshold.js";

export function summarizePrimaryConversionMappingsForThreshold(items: PrimaryConversionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveModelThresholdsFromMapping(items: PrimaryConversionMapping[]): ModelThreshold[] {
  const out: ModelThreshold[] = [];
  for (const item of items) {
    const derived = newModelThreshold(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleModelThreshold(item: ModelThreshold): string {
  return classifyDefaultConversionAgreement(item.measuredValue());
}
