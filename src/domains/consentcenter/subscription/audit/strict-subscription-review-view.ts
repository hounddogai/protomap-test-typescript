import * as text from "../../../../kit/text.js";
import { StrictSubscriptionReview } from "./strict-subscription-review.js";

/** How screens and exports show a strict subscription review. */
export class StrictSubscriptionReviewView {
  code: string;
  label: string;
  windowDays: string;
  ceiling: string;
  rate: string;
  description: string;
  categoryText: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    windowDays: string,
    ceiling: string,
    rate: string,
    description: string,
    categoryText: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.ceiling = ceiling;
    this.rate = rate;
    this.description = description;
    this.categoryText = categoryText;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toStrictSubscriptionReviewView(item: StrictSubscriptionReview): StrictSubscriptionReviewView {
  return new StrictSubscriptionReviewView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    String(item.windowDays),
    item.ceiling.toFixed(2),
    item.rate.toFixed(2),
    item.description,
    item.category,
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictSubscriptionReviewViews(items: StrictSubscriptionReview[]): StrictSubscriptionReviewView[] {
  const views: StrictSubscriptionReviewView[] = [];
  for (const item of items) {
    views.push(toStrictSubscriptionReviewView(item));
  }
  return views;
}

export function sumStrictSubscriptionReviewView(view: StrictSubscriptionReviewView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedWindowDays + parsedCeiling + parsedRate;
}
