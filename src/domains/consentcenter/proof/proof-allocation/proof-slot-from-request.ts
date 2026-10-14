import { DefaultSuppressionRequest } from "../../suppression/suppression-request/default-suppression-request.js";
import {
  tieredSuppressionEstimateBucket,
} from "../../suppression/suppression-request/tiered-suppression-estimate-policy.js";
import { ProofSlot, newProofSlot } from "./proof-slot.js";

export function summarizeDefaultSuppressionRequestsForSlot(items: DefaultSuppressionRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveProofSlotsFromRequest(items: DefaultSuppressionRequest[]): ProofSlot[] {
  const out: ProofSlot[] = [];
  for (const item of items) {
    const derived = newProofSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function normalizeProofSlot(item: ProofSlot): string {
  return tieredSuppressionEstimateBucket(item.netValue());
}
