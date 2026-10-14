import { AdaptiveConversionWindow } from "../../conversion/quota/adaptive-conversion-window.js";
import { normalizeTieredConversionQuotaCode } from "../../conversion/quota/tiered-conversion-quota-policy.js";
import { DefaultModelGroup, newDefaultModelGroup } from "./default-model-group.js";

export function summarizeAdaptiveConversionWindowsForGroup(items: AdaptiveConversionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveDefaultModelGroupsFromWindow(items: AdaptiveConversionWindow[]): DefaultModelGroup[] {
  const out: DefaultModelGroup[] = [];
  for (const item of items) {
    const derived = newDefaultModelGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileDefaultModelGroup(item: DefaultModelGroup): string {
  return normalizeTieredConversionQuotaCode(item.code);
}
