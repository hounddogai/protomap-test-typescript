import * as text from "../../../../kit/text.js";
import { RegionalCreativeReview } from "./regional-creative-review.js";

/** How screens and exports show a regional creative review. */
export class RegionalCreativeReviewView {
  code: string;
  titleText: string;
  endsAt: string;
  phone: string;
  limitText: string;
  retriesText: string;
  ceiling: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    endsAt: string,
    phone: string,
    limitText: string,
    retriesText: string,
    ceiling: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.endsAt = endsAt;
    this.phone = phone;
    this.limitText = limitText;
    this.retriesText = retriesText;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalCreativeReviewView(item: RegionalCreativeReview): RegionalCreativeReviewView {
  return new RegionalCreativeReviewView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 64),
    String(item.endsAt),
    item.phone,
    String(item.limit),
    String(item.retries),
    item.ceiling.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalCreativeReviewViews(items: RegionalCreativeReview[]): RegionalCreativeReviewView[] {
  const views: RegionalCreativeReviewView[] = [];
  for (const item of items) {
    views.push(toRegionalCreativeReviewView(item));
  }
  return views;
}

export function sumRegionalCreativeReviewView(view: RegionalCreativeReviewView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedEndsAt + parsedLimit + parsedRetries;
}
