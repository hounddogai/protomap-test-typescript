import * as text from "../../../../kit/text.js";
import { SeasonalSubscriptionTier } from "./seasonal-subscription-tier.js";

/** How screens and exports show a seasonal subscription tier. */
export class SeasonalSubscriptionTierView {
  code: string;
  title: string;
  regionText: string;
  updatedAt: string;
  limitText: string;
  priorityText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    regionText: string,
    updatedAt: string,
    limitText: string,
    priorityText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.regionText = regionText;
    this.updatedAt = updatedAt;
    this.limitText = limitText;
    this.priorityText = priorityText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalSubscriptionTierView(item: SeasonalSubscriptionTier): SeasonalSubscriptionTierView {
  return new SeasonalSubscriptionTierView(
    item.code,
    item.title,
    text.truncate(item.region, 40),
    String(item.updatedAt),
    String(item.limit),
    String(item.priority),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalSubscriptionTierViews(items: SeasonalSubscriptionTier[]): SeasonalSubscriptionTierView[] {
  const views: SeasonalSubscriptionTierView[] = [];
  for (const item of items) {
    views.push(toSeasonalSubscriptionTierView(item));
  }
  return views;
}

export function sumSeasonalSubscriptionTierView(view: SeasonalSubscriptionTierView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedUpdatedAt + parsedLimit + parsedPriority;
}
