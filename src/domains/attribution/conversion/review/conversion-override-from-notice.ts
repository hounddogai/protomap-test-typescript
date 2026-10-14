import { TouchpointNotice } from "../../touchpoint/segment/touchpoint-notice.js";
import { normalizeTouchpointReservationCode } from "../../touchpoint/segment/touchpoint-reservation-policy.js";
import { ConversionOverride, newConversionOverride } from "./conversion-override.js";

export function summarizeTouchpointNoticesForOverride(items: TouchpointNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveConversionOverridesFromNotice(items: TouchpointNotice[]): ConversionOverride[] {
  const out: ConversionOverride[] = [];
  for (const item of items) {
    const derived = newConversionOverride(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function splitConversionOverride(item: ConversionOverride): string {
  return normalizeTouchpointReservationCode(item.code);
}
