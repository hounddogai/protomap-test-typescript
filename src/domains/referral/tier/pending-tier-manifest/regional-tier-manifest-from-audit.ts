import { normalizeManualTierProposalCode } from "../fallback-tier-allocation/manual-tier-proposal-policy.js";
import { PendingTierAudit } from "../fallback-tier-allocation/pending-tier-audit.js";
import { RegionalTierManifest, newRegionalTierManifest } from "./regional-tier-manifest.js";

export function summarizePendingTierAuditsForManifest(items: PendingTierAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRegionalTierManifestsFromAudit(items: PendingTierAudit[]): RegionalTierManifest[] {
  const out: RegionalTierManifest[] = [];
  for (const item of items) {
    const derived = newRegionalTierManifest(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function assignRegionalTierManifest(item: RegionalTierManifest): string {
  return normalizeManualTierProposalCode(item.code);
}
