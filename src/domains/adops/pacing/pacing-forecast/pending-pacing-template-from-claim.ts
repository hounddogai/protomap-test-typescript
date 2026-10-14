import { PlacementClaim } from "../../placement/ledger/placement-claim.js";
import { weightedPlacementLedgerBucket } from "../../placement/ledger/weighted-placement-ledger-policy.js";
import { PendingPacingTemplate, newPendingPacingTemplate } from "./pending-pacing-template.js";

export function summarizePlacementClaimsForTemplate(items: PlacementClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function derivePendingPacingTemplatesFromClaim(items: PlacementClaim[]): PendingPacingTemplate[] {
  const out: PendingPacingTemplate[] = [];
  for (const item of items) {
    const derived = newPendingPacingTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePendingPacingTemplate(item: PendingPacingTemplate): string {
  return weightedPlacementLedgerBucket(item.effectiveValue());
}
