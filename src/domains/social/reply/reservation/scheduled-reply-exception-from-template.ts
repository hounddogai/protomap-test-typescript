import { postOverrideBucket } from "../../post/template/post-override-policy.js";
import { PostTemplate } from "../../post/template/post-template.js";
import { ScheduledReplyException, newScheduledReplyException } from "./scheduled-reply-exception.js";

export function summarizePostTemplatesForException(items: PostTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveScheduledReplyExceptionsFromTemplate(items: PostTemplate[]): ScheduledReplyException[] {
  const out: ScheduledReplyException[] = [];
  for (const item of items) {
    const derived = newScheduledReplyException(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileScheduledReplyException(item: ScheduledReplyException): string {
  return postOverrideBucket(item.measuredValue());
}
