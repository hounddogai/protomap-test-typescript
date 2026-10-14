import { complaintAuditWeight } from "../../complaint/ledger/complaint-audit-policy.js";
import { ComplaintAudit } from "../../complaint/ledger/complaint-audit.js";
import { RegionalReputationEntry, newRegionalReputationEntry } from "./regional-reputation-entry.js";

export function summarizeComplaintAuditsForEntry(items: ComplaintAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRegionalReputationEntriesFromAudit(items: ComplaintAudit[]): RegionalReputationEntry[] {
  const out: RegionalReputationEntry[] = [];
  for (const item of items) {
    const derived = newRegionalReputationEntry(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyRegionalReputationEntry(item: RegionalReputationEntry): number {
  return complaintAuditWeight(4, true);
}
