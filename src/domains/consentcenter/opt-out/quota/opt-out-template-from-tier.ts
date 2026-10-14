import { proofScheduleBucket } from "../../proof/allocation/proof-schedule-policy.js";
import { ProofTier } from "../../proof/allocation/proof-tier.js";
import { OptOutTemplate, newOptOutTemplate } from "./opt-out-template.js";

export function summarizeProofTiersForTemplate(items: ProofTier[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveOptOutTemplatesFromTier(items: ProofTier[]): OptOutTemplate[] {
  const out: OptOutTemplate[] = [];
  for (const item of items) {
    const derived = newOptOutTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeOptOutTemplate(item: OptOutTemplate): string {
  return proofScheduleBucket(item.weightedValue());
}
