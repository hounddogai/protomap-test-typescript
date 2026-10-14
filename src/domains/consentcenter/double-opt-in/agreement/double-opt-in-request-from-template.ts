import { preferenceAssignmentBucket } from "../../preference/template/preference-assignment-policy.js";
import { PreferenceTemplate } from "../../preference/template/preference-template.js";
import { DoubleOptInRequest, newDoubleOptInRequest } from "./double-opt-in-request.js";

export function summarizePreferenceTemplatesForRequest(items: PreferenceTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveDoubleOptInRequestsFromTemplate(items: PreferenceTemplate[]): DoubleOptInRequest[] {
  const out: DoubleOptInRequest[] = [];
  for (const item of items) {
    const derived = newDoubleOptInRequest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceDoubleOptInRequest(item: DoubleOptInRequest): string {
  return preferenceAssignmentBucket(item.weightedTotal());
}
