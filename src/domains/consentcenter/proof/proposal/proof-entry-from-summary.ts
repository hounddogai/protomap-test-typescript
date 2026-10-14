import { normalizePendingProofAuditCode } from "../summary/pending-proof-audit-policy.js";
import { ProofSummary } from "../summary/proof-summary.js";
import { ProofEntry, newProofEntry } from "./proof-entry.js";

export function summarizeProofSummariesForEntry(items: ProofSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveProofEntriesFromSummary(items: ProofSummary[]): ProofEntry[] {
  const out: ProofEntry[] = [];
  for (const item of items) {
    const derived = newProofEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function rankProofEntry(item: ProofEntry): string {
  return normalizePendingProofAuditCode(item.code);
}
