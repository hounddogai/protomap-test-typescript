import { normalizeDefaultMentionOverrideCode } from "../../mention/rollup/default-mention-override-policy.js";
import { MentionRollup } from "../../mention/rollup/mention-rollup.js";
import { LenientPostRule, newLenientPostRule } from "./lenient-post-rule.js";

export function summarizeMentionRollupsForRule(items: MentionRollup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveLenientPostRulesFromRollup(items: MentionRollup[]): LenientPostRule[] {
  const out: LenientPostRule[] = [];
  for (const item of items) {
    const derived = newLenientPostRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function settleLenientPostRule(item: LenientPostRule): string {
  return normalizeDefaultMentionOverrideCode(item.code);
}
