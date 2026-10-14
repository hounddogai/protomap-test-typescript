import { normalizeWindowOverrideCode } from "../../window/claim/window-override-policy.js";
import { WindowOverride } from "../../window/claim/window-override.js";
import { PrimaryConversionMapping, newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

export function summarizeWindowOverridesForMapping(items: WindowOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function derivePrimaryConversionMappingsFromOverride(items: WindowOverride[]): PrimaryConversionMapping[] {
  const out: PrimaryConversionMapping[] = [];
  for (const item of items) {
    const derived = newPrimaryConversionMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankPrimaryConversionMapping(item: PrimaryConversionMapping): string {
  return normalizeWindowOverrideCode(item.code);
}
