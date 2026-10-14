import { RegionalReputationAllocation } from "../../reputation/reputation-override/regional-reputation-allocation.js";
import { reputationTargetWeight } from "../../reputation/reputation-override/reputation-target-policy.js";
import { StrictDomainRecord, newStrictDomainRecord } from "./strict-domain-record.js";

export function summarizeRegionalReputationAllocationsForRecord(items: RegionalReputationAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveStrictDomainRecordsFromAllocation(items: RegionalReputationAllocation[]): StrictDomainRecord[] {
  const out: StrictDomainRecord[] = [];
  for (const item of items) {
    const derived = newStrictDomainRecord(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveStrictDomainRecord(item: StrictDomainRecord): number {
  return reputationTargetWeight(4, true);
}
