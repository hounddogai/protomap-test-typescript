import { normalizeWeightedPreferenceRequestCode } from "../ledger/weighted-preference-request-policy.js";
import { WeightedPreferenceRequest } from "../ledger/weighted-preference-request.js";
import { LenientPreferenceBaseline, newLenientPreferenceBaseline } from "./lenient-preference-baseline.js";

export function summarizeWeightedPreferenceRequestsForBaseline(items: WeightedPreferenceRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientPreferenceBaselinesFromRequest(items: WeightedPreferenceRequest[]): LenientPreferenceBaseline[] {
  const out: LenientPreferenceBaseline[] = [];
  for (const item of items) {
    const derived = newLenientPreferenceBaseline(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeLenientPreferenceBaseline(item: LenientPreferenceBaseline): string {
  return normalizeWeightedPreferenceRequestCode(item.code);
}
