import {
  scheduledTouchpointPreferenceBucket,
} from "../../touchpoint/touchpoint-estimate/scheduled-touchpoint-preference-policy.js";
import {
  ScheduledTouchpointPreference,
} from "../../touchpoint/touchpoint-estimate/scheduled-touchpoint-preference.js";
import { ConversionException, newConversionException } from "./conversion-exception.js";

export function summarizeScheduledTouchpointPreferencesForException(items: ScheduledTouchpointPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveConversionExceptionsFromPreference(items: ScheduledTouchpointPreference[]): ConversionException[] {
  const out: ConversionException[] = [];
  for (const item of items) {
    const derived = newConversionException(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyConversionException(item: ConversionException): string {
  return scheduledTouchpointPreferenceBucket(item.adjustedVolume());
}
