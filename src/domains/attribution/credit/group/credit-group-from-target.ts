import { RollingWindowTarget } from "../../window/item/rolling-window-target.js";
import { windowItemWeight } from "../../window/item/window-item-policy.js";
import { CreditGroup, newCreditGroup } from "./credit-group.js";

export function summarizeRollingWindowTargetsForGroup(items: RollingWindowTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveCreditGroupsFromTarget(items: RollingWindowTarget[]): CreditGroup[] {
  const out: CreditGroup[] = [];
  for (const item of items) {
    const derived = newCreditGroup(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCreditGroup(item: CreditGroup): number {
  return windowItemWeight(5, true);
}
