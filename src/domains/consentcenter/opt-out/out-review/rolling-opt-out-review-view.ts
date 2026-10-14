import * as text from "../../../../kit/text.js";
import { RollingOptOutReview } from "./rolling-opt-out-review.js";

/** How screens and exports show a rolling opt out review. */
export class RollingOptOutReviewView {
  code: string;
  title: string;
  approvedText: string;
  externalRef: string;
  discount: string;
  quantityText: string;
  segment: string;
  maximum: string;
  region: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    approvedText: string,
    externalRef: string,
    discount: string,
    quantityText: string,
    segment: string,
    maximum: string,
    region: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.approvedText = approvedText;
    this.externalRef = externalRef;
    this.discount = discount;
    this.quantityText = quantityText;
    this.segment = segment;
    this.maximum = maximum;
    this.region = region;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toRollingOptOutReviewView(item: RollingOptOutReview): RollingOptOutReviewView {
  return new RollingOptOutReviewView(
    item.code,
    item.title,
    `${item.approved}`,
    text.truncate(item.externalRef, 120),
    item.discount.toFixed(2),
    String(item.quantity),
    item.segment,
    item.maximum.toFixed(2),
    item.region,
    text.truncate(item.contactEmail, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingOptOutReviewViews(items: RollingOptOutReview[]): RollingOptOutReviewView[] {
  const views: RollingOptOutReviewView[] = [];
  for (const item of items) {
    views.push(toRollingOptOutReviewView(item));
  }
  return views;
}

export function sumRollingOptOutReviewView(view: RollingOptOutReviewView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedDiscount + parsedQuantity + parsedMaximum;
}
