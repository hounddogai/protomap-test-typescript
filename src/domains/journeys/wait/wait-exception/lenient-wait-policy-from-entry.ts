import { exitRuleRequestBucket } from "../../exit-rule/notice/exit-rule-request-policy.js";
import { GlobalExitRuleEntry } from "../../exit-rule/notice/global-exit-rule-entry.js";
import { LenientWaitPolicy, newLenientWaitPolicy } from "./lenient-wait-policy.js";

export function summarizeGlobalExitRuleEntriesForPolicy(items: GlobalExitRuleEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveLenientWaitPoliciesFromEntry(items: GlobalExitRuleEntry[]): LenientWaitPolicy[] {
  const out: LenientWaitPolicy[] = [];
  for (const item of items) {
    const derived = newLenientWaitPolicy(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveLenientWaitPolicy(item: LenientWaitPolicy): string {
  return exitRuleRequestBucket(item.measuredValue());
}
