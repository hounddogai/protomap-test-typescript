import * as text from "../../../../kit/text.js";
import { SeasonalPaywallReview } from "./seasonal-paywall-review.js";

/** How screens and exports show a seasonal paywall review. */
export class SeasonalPaywallReviewView {
  code: string;
  name: string;
  maximum: string;
  notes: string;
  source: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    maximum: string,
    notes: string,
    source: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.notes = notes;
    this.source = source;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalPaywallReviewView(item: SeasonalPaywallReview): SeasonalPaywallReviewView {
  return new SeasonalPaywallReviewView(
    text.truncate(item.code, 120),
    text.truncate(item.name, 120),
    item.maximum.toFixed(2),
    item.notes,
    item.source,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalPaywallReviewViews(items: SeasonalPaywallReview[]): SeasonalPaywallReviewView[] {
  const views: SeasonalPaywallReviewView[] = [];
  for (const item of items) {
    views.push(toSeasonalPaywallReviewView(item));
  }
  return views;
}

export function sumSeasonalPaywallReviewView(view: SeasonalPaywallReviewView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedMaximum + parsedLimit;
}
