import { proofBundleBucket } from "../checkpoint/proof-bundle-policy.js";
import { ProofBundle } from "../checkpoint/proof-bundle.js";
import { ManualProofDraft, newManualProofDraft } from "./manual-proof-draft.js";

export function summarizeProofBundlesForDraft(items: ProofBundle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveManualProofDraftsFromBundle(items: ProofBundle[]): ManualProofDraft[] {
  const out: ManualProofDraft[] = [];
  for (const item of items) {
    const derived = newManualProofDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceManualProofDraft(item: ManualProofDraft): string {
  return proofBundleBucket(item.measuredValue());
}
