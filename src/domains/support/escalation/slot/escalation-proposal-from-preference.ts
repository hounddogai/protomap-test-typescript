import { TicketViewPreference } from "../../ticket-view/score/ticket-view-preference.js";
import { normalizeTicketViewScoreCode } from "../../ticket-view/score/ticket-view-score-policy.js";
import { EscalationProposal, newEscalationProposal } from "./escalation-proposal.js";

export function summarizeTicketViewPreferencesForProposal(items: TicketViewPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveEscalationProposalsFromPreference(items: TicketViewPreference[]): EscalationProposal[] {
  const out: EscalationProposal[] = [];
  for (const item of items) {
    const derived = newEscalationProposal(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignEscalationProposal(item: EscalationProposal): string {
  return normalizeTicketViewScoreCode(item.code);
}
