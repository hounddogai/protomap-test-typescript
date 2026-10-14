import { classifyPendingReplyAudit } from "../mapping/pending-reply-audit-policy.js";
import { SeasonalReplyProposal } from "../mapping/seasonal-reply-proposal.js";
import { ReplyTemplate, newReplyTemplate } from "./reply-template.js";

export function summarizeSeasonalReplyProposalsForTemplate(items: SeasonalReplyProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveReplyTemplatesFromProposal(items: SeasonalReplyProposal[]): ReplyTemplate[] {
  const out: ReplyTemplate[] = [];
  for (const item of items) {
    const derived = newReplyTemplate(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveReplyTemplate(item: ReplyTemplate): string {
  return classifyPendingReplyAudit(item.netValue());
}
