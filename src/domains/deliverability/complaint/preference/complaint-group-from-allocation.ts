import { ComplaintAllocation } from "../batch/complaint-allocation.js";
import { complaintBatchBucket } from "../batch/complaint-batch-policy.js";
import { ComplaintGroup, newComplaintGroup } from "./complaint-group.js";

export function summarizeComplaintAllocationsForGroup(items: ComplaintAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveComplaintGroupsFromAllocation(items: ComplaintAllocation[]): ComplaintGroup[] {
  const out: ComplaintGroup[] = [];
  for (const item of items) {
    const derived = newComplaintGroup(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveComplaintGroup(item: ComplaintGroup): string {
  return complaintBatchBucket(item.adjustedValue());
}
