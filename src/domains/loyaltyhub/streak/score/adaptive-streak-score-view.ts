import * as text from "../../../../kit/text.js";
import { AdaptiveStreakScore } from "./adaptive-streak-score.js";

/** How screens and exports show a adaptive streak score. */
export class AdaptiveStreakScoreView {
  code: string;
  name: string;
  limit: string;
  discount: string;
  windowDaysText: string;
  descriptionText: string;
  approved: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limit: string,
    discount: string,
    windowDaysText: string,
    descriptionText: string,
    approved: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.discount = discount;
    this.windowDaysText = windowDaysText;
    this.descriptionText = descriptionText;
    this.approved = approved;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveStreakScoreView(item: AdaptiveStreakScore): AdaptiveStreakScoreView {
  return new AdaptiveStreakScoreView(
    item.code,
    item.name,
    String(item.limit),
    item.discount.toFixed(2),
    String(item.windowDays),
    text.truncate(item.description, 64),
    `${item.approved}`,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveStreakScoreViews(items: AdaptiveStreakScore[]): AdaptiveStreakScoreView[] {
  const views: AdaptiveStreakScoreView[] = [];
  for (const item of items) {
    views.push(toAdaptiveStreakScoreView(item));
  }
  return views;
}

export function sumAdaptiveStreakScoreView(view: AdaptiveStreakScoreView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedLimit + parsedDiscount + parsedWindowDays;
}
