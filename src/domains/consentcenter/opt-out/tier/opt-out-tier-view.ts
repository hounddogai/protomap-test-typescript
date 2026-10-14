import * as text from "../../../../kit/text.js";
import { OptOutTier } from "./opt-out-tier.js";

/** How screens and exports show a opt out tier. */
export class OptOutTierView {
  code: string;
  titleText: string;
  updatedAtText: string;
  marginText: string;
  region: string;
  pinned: string;
  timezone: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAtText: string,
    marginText: string,
    region: string,
    pinned: string,
    timezone: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAtText = updatedAtText;
    this.marginText = marginText;
    this.region = region;
    this.pinned = pinned;
    this.timezone = timezone;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutTierView(item: OptOutTier): OptOutTierView {
  return new OptOutTierView(
    item.code,
    item.title,
    String(item.updatedAt),
    item.margin.toFixed(2),
    text.truncate(item.region, 80),
    `${item.pinned}`,
    item.timezone,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutTierViews(items: OptOutTier[]): OptOutTierView[] {
  const views: OptOutTierView[] = [];
  for (const item of items) {
    views.push(toOptOutTierView(item));
  }
  return views;
}

export function sumOptOutTierView(view: OptOutTierView): number {
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedUpdatedAt + parsedMargin + parsedBudget;
}
