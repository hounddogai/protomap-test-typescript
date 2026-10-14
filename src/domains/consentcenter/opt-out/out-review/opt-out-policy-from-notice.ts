import { defaultDoubleOptInScoreWeight } from "../../double-opt-in/notice/default-double-opt-in-score-policy.js";
import { DoubleOptInNotice } from "../../double-opt-in/notice/double-opt-in-notice.js";
import { OptOutPolicy, newOptOutPolicy } from "./opt-out-policy.js";

export function summarizeDoubleOptInNoticesForPolicy(items: DoubleOptInNotice[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveOptOutPoliciesFromNotice(items: DoubleOptInNotice[]): OptOutPolicy[] {
  const out: OptOutPolicy[] = [];
  for (const item of items) {
    const derived = newOptOutPolicy(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeOptOutPolicy(item: OptOutPolicy): number {
  return defaultDoubleOptInScoreWeight(5, true);
}
