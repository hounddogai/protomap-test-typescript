import { reputationEntryWeight } from "../../reputation/record-item/reputation-entry-policy.js";
import { ReputationRecord } from "../../reputation/record-item/reputation-record.js";
import { ComplaintOverride, newComplaintOverride } from "./complaint-override.js";

export function summarizeReputationRecordsForOverride(items: ReputationRecord[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintOverridesFromRecord(items: ReputationRecord[]): ComplaintOverride[] {
  const out: ComplaintOverride[] = [];
  for (const item of items) {
    const derived = newComplaintOverride(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectComplaintOverride(item: ComplaintOverride): number {
  return reputationEntryWeight(7, true);
}
