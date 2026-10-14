import { classifyPrimaryCreditException } from "../../credit/group/primary-credit-exception-policy.js";
import { PrimaryCreditException } from "../../credit/group/primary-credit-exception.js";
import { RollingModelThreshold, newRollingModelThreshold } from "./rolling-model-threshold.js";

export function summarizePrimaryCreditExceptionsForThreshold(items: PrimaryCreditException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveRollingModelThresholdsFromException(items: PrimaryCreditException[]): RollingModelThreshold[] {
  const out: RollingModelThreshold[] = [];
  for (const item of items) {
    const derived = newRollingModelThreshold(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRollingModelThreshold(item: RollingModelThreshold): string {
  return classifyPrimaryCreditException(item.netLoad());
}
