import { classifyDefaultSenderRule } from "../rule/default-sender-rule-policy.js";
import { DefaultSenderRule } from "../rule/default-sender-rule.js";
import { SenderPolicy, newSenderPolicy } from "./sender-policy.js";

export function summarizeDefaultSenderRulesForPolicy(items: DefaultSenderRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveSenderPoliciesFromRule(items: DefaultSenderRule[]): SenderPolicy[] {
  const out: SenderPolicy[] = [];
  for (const item of items) {
    const derived = newSenderPolicy(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function settleSenderPolicy(item: SenderPolicy): string {
  return classifyDefaultSenderRule(item.netTotal());
}
