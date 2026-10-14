import {
  regionalDoubleOptInEntryWeight,
} from "../../double-opt-in/allocation/regional-double-opt-in-entry-policy.js";
import { RegionalDoubleOptInEntry } from "../../double-opt-in/allocation/regional-double-opt-in-entry.js";
import { ProofAudit, newProofAudit } from "./proof-audit.js";

export function summarizeRegionalDoubleOptInEntriesForAudit(items: RegionalDoubleOptInEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveProofAuditsFromEntry(items: RegionalDoubleOptInEntry[]): ProofAudit[] {
  const out: ProofAudit[] = [];
  for (const item of items) {
    const derived = newProofAudit(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function planProofAudit(item: ProofAudit): number {
  return regionalDoubleOptInEntryWeight(8, true);
}
