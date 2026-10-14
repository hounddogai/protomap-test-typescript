import * as text from "../../../../kit/text.js";
import { DomainReview } from "./domain-review.js";

/** How screens and exports show a domain review. */
export class DomainReviewView {
  code: string;
  name: string;
  campaignRef: string;
  locale: string;
  phone: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    locale: string,
    phone: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.phone = phone;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toDomainReviewView(item: DomainReview): DomainReviewView {
  return new DomainReviewView(
    item.code,
    item.name,
    item.campaignRef,
    item.locale,
    text.truncate(item.phone, 80),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDomainReviewViews(items: DomainReview[]): DomainReviewView[] {
  const views: DomainReviewView[] = [];
  for (const item of items) {
    views.push(toDomainReviewView(item));
  }
  return views;
}

export function sumDomainReviewView(view: DomainReviewView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
