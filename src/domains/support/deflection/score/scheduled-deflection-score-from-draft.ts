import { normalizeTicketViewDraftCode } from "../../ticket-view/draft/ticket-view-draft-policy.js";
import { TicketViewDraft } from "../../ticket-view/draft/ticket-view-draft.js";
import { ScheduledDeflectionScore, newScheduledDeflectionScore } from "./scheduled-deflection-score.js";

export function summarizeTicketViewDraftsForScore(items: TicketViewDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveScheduledDeflectionScoresFromDraft(items: TicketViewDraft[]): ScheduledDeflectionScore[] {
  const out: ScheduledDeflectionScore[] = [];
  for (const item of items) {
    const derived = newScheduledDeflectionScore(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchScheduledDeflectionScore(item: ScheduledDeflectionScore): string {
  return normalizeTicketViewDraftCode(item.code);
}
