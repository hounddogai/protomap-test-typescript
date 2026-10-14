import * as text from "../../../../kit/text.js";
import { SeasonalRewardBudget } from "./seasonal-reward-budget.js";

/** How screens and exports show a seasonal reward budget. */
export class SeasonalRewardBudgetView {
  code: string;
  label: string;
  countryText: string;
  minimum: string;
  windowDaysText: string;
  active: string;
  pinned: string;
  category: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    countryText: string,
    minimum: string,
    windowDaysText: string,
    active: string,
    pinned: string,
    category: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.countryText = countryText;
    this.minimum = minimum;
    this.windowDaysText = windowDaysText;
    this.active = active;
    this.pinned = pinned;
    this.category = category;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalRewardBudgetView(item: SeasonalRewardBudget): SeasonalRewardBudgetView {
  return new SeasonalRewardBudgetView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.country, 40),
    item.minimum.toFixed(2),
    String(item.windowDays),
    `${item.active}`,
    `${item.pinned}`,
    item.category,
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalRewardBudgetViews(items: SeasonalRewardBudget[]): SeasonalRewardBudgetView[] {
  const views: SeasonalRewardBudgetView[] = [];
  for (const item of items) {
    views.push(toSeasonalRewardBudgetView(item));
  }
  return views;
}

export function sumSeasonalRewardBudgetView(view: SeasonalRewardBudgetView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedMinimum + parsedWindowDays;
}
