import * as text from "../../../../kit/text.js";
import { LegacyPostReview } from "./legacy-post-review.js";

/** How screens and exports show a legacy post review. */
export class LegacyPostReviewView {
  codeText: string;
  titleText: string;
  openRate: string;
  cost: string;
  discount: string;
  rate: string;
  pinned: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    openRate: string,
    cost: string,
    discount: string,
    rate: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.openRate = openRate;
    this.cost = cost;
    this.discount = discount;
    this.rate = rate;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPostReviewView(item: LegacyPostReview): LegacyPostReviewView {
  return new LegacyPostReviewView(
    text.truncate(item.code, 80),
    item.title,
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    item.discount.toFixed(2),
    item.rate.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPostReviewViews(items: LegacyPostReview[]): LegacyPostReviewView[] {
  const views: LegacyPostReviewView[] = [];
  for (const item of items) {
    views.push(toLegacyPostReviewView(item));
  }
  return views;
}

export function sumLegacyPostReviewView(view: LegacyPostReviewView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedOpenRate + parsedCost + parsedDiscount;
}
