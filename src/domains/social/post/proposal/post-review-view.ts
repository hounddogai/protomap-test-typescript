import * as text from "../../../../kit/text.js";
import { PostReview } from "./post-review.js";

/** How screens and exports show a post review. */
export class PostReviewView {
  code: string;
  labelText: string;
  description: string;
  ownerIdText: string;
  reviewer: string;
  regionText: string;
  retries: string;
  cost: string;
  graceDaysText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    description: string,
    ownerIdText: string,
    reviewer: string,
    regionText: string,
    retries: string,
    cost: string,
    graceDaysText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.description = description;
    this.ownerIdText = ownerIdText;
    this.reviewer = reviewer;
    this.regionText = regionText;
    this.retries = retries;
    this.cost = cost;
    this.graceDaysText = graceDaysText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPostReviewView(item: PostReview): PostReviewView {
  return new PostReviewView(
    item.code,
    item.label,
    item.description,
    text.truncate(item.ownerId, 40),
    item.reviewer,
    item.region,
    String(item.retries),
    item.cost.toFixed(2),
    String(item.graceDays),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPostReviewViews(items: PostReview[]): PostReviewView[] {
  const views: PostReviewView[] = [];
  for (const item of items) {
    views.push(toPostReviewView(item));
  }
  return views;
}

export function sumPostReviewView(view: PostReviewView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedRetries + parsedCost + parsedGraceDays;
}
