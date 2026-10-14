import { normalizePostDraftCode } from "../draft/post-draft-policy.js";
import { PostDraft } from "../draft/post-draft.js";
import { FallbackPostRule, newFallbackPostRule } from "./fallback-post-rule.js";

export function summarizePostDraftsForRule(items: PostDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveFallbackPostRulesFromDraft(items: PostDraft[]): FallbackPostRule[] {
  const out: FallbackPostRule[] = [];
  for (const item of items) {
    const derived = newFallbackPostRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileFallbackPostRule(item: FallbackPostRule): string {
  return normalizePostDraftCode(item.code);
}
