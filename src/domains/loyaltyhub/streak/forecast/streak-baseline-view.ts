import { StreakBaseline } from "./streak-baseline.js";

/** How screens and exports show a streak baseline. */
export class StreakBaselineView {
  code: string;
  name: string;
  impressions: string;
  country: string;
  budget: string;
  updatedAtText: string;
  amount: string;
  region: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    impressions: string,
    country: string,
    budget: string,
    updatedAtText: string,
    amount: string,
    region: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.country = country;
    this.budget = budget;
    this.updatedAtText = updatedAtText;
    this.amount = amount;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toStreakBaselineView(item: StreakBaseline): StreakBaselineView {
  return new StreakBaselineView(
    item.code,
    item.name,
    String(item.impressions),
    item.country,
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.amount.toFixed(2),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakBaselineViews(items: StreakBaseline[]): StreakBaselineView[] {
  const views: StreakBaselineView[] = [];
  for (const item of items) {
    views.push(toStreakBaselineView(item));
  }
  return views;
}

export function sumStreakBaselineView(view: StreakBaselineView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedImpressions + parsedBudget + parsedUpdatedAt;
}
