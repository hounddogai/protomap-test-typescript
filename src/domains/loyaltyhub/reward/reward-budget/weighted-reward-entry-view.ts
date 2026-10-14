import { WeightedRewardEntry } from "./weighted-reward-entry.js";

/** How screens and exports show a weighted reward entry. */
export class WeightedRewardEntryView {
  code: string;
  nameText: string;
  locale: string;
  cost: string;
  budget: string;
  statusLabel: string;

  constructor(code: string, nameText: string, locale: string, cost: string, budget: string, statusLabel: string) {
    this.code = code;
    this.nameText = nameText;
    this.locale = locale;
    this.cost = cost;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardEntryView(item: WeightedRewardEntry): WeightedRewardEntryView {
  return new WeightedRewardEntryView(
    item.code,
    item.name,
    item.locale,
    item.cost.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardEntryViews(items: WeightedRewardEntry[]): WeightedRewardEntryView[] {
  const views: WeightedRewardEntryView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardEntryView(item));
  }
  return views;
}

export function sumWeightedRewardEntryView(view: WeightedRewardEntryView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedCost + parsedBudget;
}
