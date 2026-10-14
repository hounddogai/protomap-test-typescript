import { batchedMacroScoreWeight } from "../../macro/macro-score/batched-macro-score-policy.js";
import { BatchedMacroScore } from "../../macro/macro-score/batched-macro-score.js";
import { AdaptiveTicketViewLedger, newAdaptiveTicketViewLedger } from "./adaptive-ticket-view-ledger.js";

export function summarizeBatchedMacroScoresForLedger(items: BatchedMacroScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveAdaptiveTicketViewLedgersFromScore(items: BatchedMacroScore[]): AdaptiveTicketViewLedger[] {
  const out: AdaptiveTicketViewLedger[] = [];
  for (const item of items) {
    const derived = newAdaptiveTicketViewLedger(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileAdaptiveTicketViewLedger(item: AdaptiveTicketViewLedger): number {
  return batchedMacroScoreWeight(4, true);
}
