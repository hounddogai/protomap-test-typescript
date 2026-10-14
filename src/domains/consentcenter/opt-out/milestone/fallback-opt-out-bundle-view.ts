import * as text from "../../../../kit/text.js";
import { FallbackOptOutBundle } from "./fallback-opt-out-bundle.js";

/** How screens and exports show a fallback opt out bundle. */
export class FallbackOptOutBundleView {
  code: string;
  labelText: string;
  cost: string;
  budget: string;
  active: string;
  statusLabel: string;

  constructor(code: string, labelText: string, cost: string, budget: string, active: string, statusLabel: string) {
    this.code = code;
    this.labelText = labelText;
    this.cost = cost;
    this.budget = budget;
    this.active = active;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackOptOutBundleView(item: FallbackOptOutBundle): FallbackOptOutBundleView {
  return new FallbackOptOutBundleView(
    item.code,
    text.truncate(item.label, 80),
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackOptOutBundleViews(items: FallbackOptOutBundle[]): FallbackOptOutBundleView[] {
  const views: FallbackOptOutBundleView[] = [];
  for (const item of items) {
    views.push(toFallbackOptOutBundleView(item));
  }
  return views;
}

export function sumFallbackOptOutBundleView(view: FallbackOptOutBundleView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCost + parsedBudget;
}
