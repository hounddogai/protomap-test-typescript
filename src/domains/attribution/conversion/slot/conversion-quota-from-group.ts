import { normalizeWindowDraftCode } from "../../window/group/window-draft-policy.js";
import { WindowGroup } from "../../window/group/window-group.js";
import { ConversionQuota, newConversionQuota } from "./conversion-quota.js";

export function summarizeWindowGroupsForQuota(items: WindowGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveConversionQuotasFromGroup(items: WindowGroup[]): ConversionQuota[] {
  const out: ConversionQuota[] = [];
  for (const item of items) {
    const derived = newConversionQuota(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignConversionQuota(item: ConversionQuota): string {
  return normalizeWindowDraftCode(item.code);
}
