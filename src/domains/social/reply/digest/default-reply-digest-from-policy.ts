import { CappedMentionPolicy } from "../../mention/target/capped-mention-policy.js";
import { normalizeScheduledMentionDigestCode } from "../../mention/target/scheduled-mention-digest-policy.js";
import { DefaultReplyDigest, newDefaultReplyDigest } from "./default-reply-digest.js";

export function summarizeCappedMentionPoliciesForDigest(items: CappedMentionPolicy[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveDefaultReplyDigestsFromPolicy(items: CappedMentionPolicy[]): DefaultReplyDigest[] {
  const out: DefaultReplyDigest[] = [];
  for (const item of items) {
    const derived = newDefaultReplyDigest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateDefaultReplyDigest(item: DefaultReplyDigest): string {
  return normalizeScheduledMentionDigestCode(item.code);
}
