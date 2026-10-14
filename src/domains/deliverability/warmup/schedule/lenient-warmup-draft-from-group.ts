import { BatchedDomainGroup } from "../../domain/exception/batched-domain-group.js";
import { normalizePendingDomainDigestCode } from "../../domain/exception/pending-domain-digest-policy.js";
import { LenientWarmupDraft, newLenientWarmupDraft } from "./lenient-warmup-draft.js";

export function summarizeBatchedDomainGroupsForDraft(items: BatchedDomainGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveLenientWarmupDraftsFromGroup(items: BatchedDomainGroup[]): LenientWarmupDraft[] {
  const out: LenientWarmupDraft[] = [];
  for (const item of items) {
    const derived = newLenientWarmupDraft(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function planLenientWarmupDraft(item: LenientWarmupDraft): string {
  return normalizePendingDomainDigestCode(item.code);
}
