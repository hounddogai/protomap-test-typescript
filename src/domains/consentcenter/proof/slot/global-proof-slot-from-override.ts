import { ProofOverride } from "../proof-agreement/proof-override.js";
import { strictProofEntryBucket } from "../proof-agreement/strict-proof-entry-policy.js";
import { GlobalProofSlot, newGlobalProofSlot } from "./global-proof-slot.js";

export function summarizeProofOverridesForSlot(items: ProofOverride[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveGlobalProofSlotsFromOverride(items: ProofOverride[]): GlobalProofSlot[] {
  const out: GlobalProofSlot[] = [];
  for (const item of items) {
    const derived = newGlobalProofSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateGlobalProofSlot(item: GlobalProofSlot): string {
  return strictProofEntryBucket(item.projectedTotal());
}
