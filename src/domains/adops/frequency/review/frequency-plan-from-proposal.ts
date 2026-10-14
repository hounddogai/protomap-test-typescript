import { normalizeFrequencyManifestCode } from "../manifest/frequency-manifest-policy.js";
import { PendingFrequencyProposal } from "../manifest/pending-frequency-proposal.js";
import { FrequencyPlan, newFrequencyPlan } from "./frequency-plan.js";

export function summarizePendingFrequencyProposalsForPlan(items: PendingFrequencyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveFrequencyPlansFromProposal(items: PendingFrequencyProposal[]): FrequencyPlan[] {
  const out: FrequencyPlan[] = [];
  for (const item of items) {
    const derived = newFrequencyPlan(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function deriveFrequencyPlan(item: FrequencyPlan): string {
  return normalizeFrequencyManifestCode(item.code);
}
