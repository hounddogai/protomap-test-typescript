import * as text from "../../../../kit/text.js";
import { LenientDoubleOptInReview } from "./lenient-double-opt-in-review.js";

/** How screens and exports show a lenient double opt in review. */
export class LenientDoubleOptInReviewView {
  codeText: string;
  nameText: string;
  currency: string;
  pinnedText: string;
  attempts: string;
  openRate: string;
  graceDays: string;
  variantText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    currency: string,
    pinnedText: string,
    attempts: string,
    openRate: string,
    graceDays: string,
    variantText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.currency = currency;
    this.pinnedText = pinnedText;
    this.attempts = attempts;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.variantText = variantText;
    this.statusLabel = statusLabel;
  }
}

export function toLenientDoubleOptInReviewView(item: LenientDoubleOptInReview): LenientDoubleOptInReviewView {
  return new LenientDoubleOptInReviewView(
    item.code,
    item.name,
    text.truncate(item.currency, 80),
    `${item.pinned}`,
    String(item.attempts),
    item.openRate.toFixed(2),
    String(item.graceDays),
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientDoubleOptInReviewViews(items: LenientDoubleOptInReview[]): LenientDoubleOptInReviewView[] {
  const views: LenientDoubleOptInReviewView[] = [];
  for (const item of items) {
    views.push(toLenientDoubleOptInReviewView(item));
  }
  return views;
}

export function sumLenientDoubleOptInReviewView(view: LenientDoubleOptInReviewView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAttempts + parsedOpenRate + parsedGraceDays;
}
