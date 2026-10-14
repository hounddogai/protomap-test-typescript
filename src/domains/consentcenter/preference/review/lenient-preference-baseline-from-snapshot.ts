import { OptOutSnapshot } from "../../opt-out/entry/opt-out-snapshot.js";
import { classifyOptOutThreshold } from "../../opt-out/entry/opt-out-threshold-policy.js";
import { LenientPreferenceBaseline, newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

export function summarizeOptOutSnapshotsForBaseline(items: OptOutSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientPreferenceBaselinesFromSnapshot(items: OptOutSnapshot[]): LenientPreferenceBaseline[] {
  const out: LenientPreferenceBaseline[] = [];
  for (const item of items) {
    const derived = newLenientPreferenceBaseline(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitLenientPreferenceBaseline(item: LenientPreferenceBaseline): string {
  return classifyOptOutThreshold(item.measuredValue());
}
