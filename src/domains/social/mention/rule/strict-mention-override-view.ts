import * as text from "../../../../kit/text.js";
import { StrictMentionOverride } from "./strict-mention-override.js";

/** How screens and exports show a strict mention override. */
export class StrictMentionOverrideView {
  code: string;
  labelText: string;
  bid: string;
  minimum: string;
  reviewerText: string;
  discountText: string;
  limit: string;
  cost: string;
  maximum: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    bid: string,
    minimum: string,
    reviewerText: string,
    discountText: string,
    limit: string,
    cost: string,
    maximum: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.bid = bid;
    this.minimum = minimum;
    this.reviewerText = reviewerText;
    this.discountText = discountText;
    this.limit = limit;
    this.cost = cost;
    this.maximum = maximum;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toStrictMentionOverrideView(item: StrictMentionOverride): StrictMentionOverrideView {
  return new StrictMentionOverrideView(
    item.code,
    item.label,
    item.bid.toFixed(2),
    item.minimum.toFixed(2),
    text.truncate(item.reviewer, 120),
    item.discount.toFixed(2),
    String(item.limit),
    item.cost.toFixed(2),
    item.maximum.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictMentionOverrideViews(items: StrictMentionOverride[]): StrictMentionOverrideView[] {
  const views: StrictMentionOverrideView[] = [];
  for (const item of items) {
    views.push(toStrictMentionOverrideView(item));
  }
  return views;
}

export function sumStrictMentionOverrideView(view: StrictMentionOverrideView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedBid + parsedMinimum + parsedDiscount;
}
