import { normalizeComplaintEstimateCode } from "../override-item/complaint-estimate-policy.js";
import { ComplaintOverride } from "../override-item/complaint-override.js";
import { ComplaintException, newComplaintException } from "./complaint-exception.js";

export function summarizeComplaintOverridesForException(items: ComplaintOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveComplaintExceptionsFromOverride(items: ComplaintOverride[]): ComplaintException[] {
  const out: ComplaintException[] = [];
  for (const item of items) {
    const derived = newComplaintException(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function balanceComplaintException(item: ComplaintException): string {
  return normalizeComplaintEstimateCode(item.code);
}
