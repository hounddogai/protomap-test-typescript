import { classifyPlacementBudget } from "../../placement/budget/placement-budget-policy.js";
import { PlacementBudget } from "../../placement/budget/placement-budget.js";
import { CreativeManifest, newCreativeManifest } from "./creative-manifest.js";

export function summarizePlacementBudgetsForManifest(items: PlacementBudget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveCreativeManifestsFromBudget(items: PlacementBudget[]): CreativeManifest[] {
  const out: CreativeManifest[] = [];
  for (const item of items) {
    const derived = newCreativeManifest(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCreativeManifest(item: CreativeManifest): string {
  return classifyPlacementBudget(item.effectiveLoad());
}
