import * as text from "../../../../kit/text.js";
import { LenientCsatReview } from "./lenient-csat-review.js";

/** How screens and exports show a lenient csat review. */
export class LenientCsatReviewView {
  codeText: string;
  labelText: string;
  audienceId: string;
  limit: string;
  bid: string;
  unit: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    audienceId: string,
    limit: string,
    bid: string,
    unit: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.audienceId = audienceId;
    this.limit = limit;
    this.bid = bid;
    this.unit = unit;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toLenientCsatReviewView(item: LenientCsatReview): LenientCsatReviewView {
  return new LenientCsatReviewView(
    item.code,
    item.label,
    text.truncate(item.audienceId, 40),
    String(item.limit),
    item.bid.toFixed(2),
    item.unit,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientCsatReviewViews(items: LenientCsatReview[]): LenientCsatReviewView[] {
  const views: LenientCsatReviewView[] = [];
  for (const item of items) {
    views.push(toLenientCsatReviewView(item));
  }
  return views;
}

export function sumLenientCsatReviewView(view: LenientCsatReviewView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedLimit + parsedBid + parsedCeiling;
}
