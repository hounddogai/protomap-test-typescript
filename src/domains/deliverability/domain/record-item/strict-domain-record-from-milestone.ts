import { classifyPendingBounceRecord } from "../../bounce/bounce-record/pending-bounce-record-policy.js";
import { TieredBounceMilestone } from "../../bounce/bounce-record/tiered-bounce-milestone.js";
import { StrictDomainRecord, newStrictDomainRecord } from "./strict-domain-record.js";

export function summarizeTieredBounceMilestonesForRecord(items: TieredBounceMilestone[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveStrictDomainRecordsFromMilestone(items: TieredBounceMilestone[]): StrictDomainRecord[] {
  const out: StrictDomainRecord[] = [];
  for (const item of items) {
    const derived = newStrictDomainRecord(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function splitStrictDomainRecord(item: StrictDomainRecord): string {
  return classifyPendingBounceRecord(item.netValue());
}
