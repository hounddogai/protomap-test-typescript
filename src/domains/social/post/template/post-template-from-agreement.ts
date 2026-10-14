import { ReplyAgreement } from "../../reply/override-item/reply-agreement.js";
import { classifyReplyForecast } from "../../reply/override-item/reply-forecast-policy.js";
import { PostTemplate, newPostTemplate } from "./post-template.js";

export function summarizeReplyAgreementsForTemplate(items: ReplyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveLoad());
  }
  return totals;
}

export function derivePostTemplatesFromAgreement(items: ReplyAgreement[]): PostTemplate[] {
  const out: PostTemplate[] = [];
  for (const item of items) {
    const derived = newPostTemplate(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignPostTemplate(item: PostTemplate): string {
  return classifyReplyForecast(item.projectedValue());
}
