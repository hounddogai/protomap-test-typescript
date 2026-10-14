import { pathAdjustmentWeight } from "../../path/rule/path-adjustment-policy.js";
import { PathCycle } from "../../path/rule/path-cycle.js";
import { CreditDraft, newCreditDraft } from "./credit-draft.js";

export function summarizePathCyclesForDraft(items: PathCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditDraftsFromCycle(items: PathCycle[]): CreditDraft[] {
  const out: CreditDraft[] = [];
  for (const item of items) {
    const derived = newCreditDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveCreditDraft(item: CreditDraft): number {
  return pathAdjustmentWeight(1, true);
}
