import * as text from "../../../../kit/text.js";
import { LenientWarmupReview } from "./lenient-warmup-review.js";

/** How screens and exports show a lenient warmup review. */
export class LenientWarmupReviewView {
  code: string;
  label: string;
  locale: string;
  currency: string;
  approved: string;
  notes: string;
  campaignRef: string;
  ownerId: string;
  unit: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    currency: string,
    approved: string,
    notes: string,
    campaignRef: string,
    ownerId: string,
    unit: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.currency = currency;
    this.approved = approved;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.ownerId = ownerId;
    this.unit = unit;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toLenientWarmupReviewView(item: LenientWarmupReview): LenientWarmupReviewView {
  return new LenientWarmupReviewView(
    text.truncate(item.code, 64),
    item.label,
    item.locale,
    item.currency,
    `${item.approved}`,
    item.notes,
    item.campaignRef,
    item.ownerId,
    text.truncate(item.unit, 120),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientWarmupReviewViews(items: LenientWarmupReview[]): LenientWarmupReviewView[] {
  const views: LenientWarmupReviewView[] = [];
  for (const item of items) {
    views.push(toLenientWarmupReviewView(item));
  }
  return views;
}

export function sumLenientWarmupReviewView(view: LenientWarmupReviewView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
