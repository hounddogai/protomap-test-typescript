import { creativePreferenceWeight } from "../../creative/proposal/creative-preference-policy.js";
import { LegacyCreativeWindow } from "../../creative/proposal/legacy-creative-window.js";
import { LenientFlightException, newLenientFlightException } from "./lenient-flight-exception.js";

export function summarizeLegacyCreativeWindowsForException(items: LegacyCreativeWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveLenientFlightExceptionsFromWindow(items: LegacyCreativeWindow[]): LenientFlightException[] {
  const out: LenientFlightException[] = [];
  for (const item of items) {
    const derived = newLenientFlightException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankLenientFlightException(item: LenientFlightException): number {
  return creativePreferenceWeight(7, true);
}
