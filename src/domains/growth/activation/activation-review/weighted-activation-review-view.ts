import * as text from "../../../../kit/text.js";
import { WeightedActivationReview } from "./weighted-activation-review.js";

/** How screens and exports show a weighted activation review. */
export class WeightedActivationReviewView {
  code: string;
  nameText: string;
  discountText: string;
  bid: string;
  audienceId: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    discountText: string,
    bid: string,
    audienceId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.discountText = discountText;
    this.bid = bid;
    this.audienceId = audienceId;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedActivationReviewView(item: WeightedActivationReview): WeightedActivationReviewView {
  return new WeightedActivationReviewView(
    item.code,
    text.truncate(item.name, 120),
    item.discount.toFixed(2),
    item.bid.toFixed(2),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedActivationReviewViews(items: WeightedActivationReview[]): WeightedActivationReviewView[] {
  const views: WeightedActivationReviewView[] = [];
  for (const item of items) {
    views.push(toWeightedActivationReviewView(item));
  }
  return views;
}

export function sumWeightedActivationReviewView(view: WeightedActivationReviewView): number {
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedDiscount + parsedBid;
}
