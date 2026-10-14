import { mentionAuditWeight } from "../../mention/schedule/mention-audit-policy.js";
import { MentionAudit } from "../../mention/schedule/mention-audit.js";
import { ReplyAgreement, newReplyAgreement } from "./reply-agreement.js";

export function summarizeMentionAuditsForAgreement(items: MentionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveReplyAgreementsFromAudit(items: MentionAudit[]): ReplyAgreement[] {
  const out: ReplyAgreement[] = [];
  for (const item of items) {
    const derived = newReplyAgreement(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function settleReplyAgreement(item: ReplyAgreement): number {
  return mentionAuditWeight(1, true);
}
