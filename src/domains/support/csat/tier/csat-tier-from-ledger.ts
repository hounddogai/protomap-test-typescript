import {
  classifyAdaptiveTicketViewLedger,
} from "../../ticket-view/view-summary/adaptive-ticket-view-ledger-policy.js";
import { AdaptiveTicketViewLedger } from "../../ticket-view/view-summary/adaptive-ticket-view-ledger.js";
import { CsatTier, newCsatTier } from "./csat-tier.js";

export function summarizeAdaptiveTicketViewLedgersForTier(items: AdaptiveTicketViewLedger[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveCsatTiersFromLedger(items: AdaptiveTicketViewLedger[]): CsatTier[] {
  const out: CsatTier[] = [];
  for (const item of items) {
    const derived = newCsatTier(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveCsatTier(item: CsatTier): string {
  return classifyAdaptiveTicketViewLedger(item.effectiveVolume());
}
