import * as text from "../../../../kit/text.js";
import { TierReview } from "./tier-review.js";

/** How screens and exports show a tier review. */
export class TierReviewView {
  code: string;
  title: string;
  version: string;
  graceDays: string;
  retries: string;
  amountText: string;
  locale: string;
  maximumText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    version: string,
    graceDays: string,
    retries: string,
    amountText: string,
    locale: string,
    maximumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.graceDays = graceDays;
    this.retries = retries;
    this.amountText = amountText;
    this.locale = locale;
    this.maximumText = maximumText;
    this.statusLabel = statusLabel;
  }
}

export function toTierReviewView(item: TierReview): TierReviewView {
  return new TierReviewView(
    text.truncate(item.code, 80),
    item.title,
    String(item.version),
    String(item.graceDays),
    String(item.retries),
    item.amount.toFixed(2),
    item.locale,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierReviewViews(items: TierReview[]): TierReviewView[] {
  const views: TierReviewView[] = [];
  for (const item of items) {
    views.push(toTierReviewView(item));
  }
  return views;
}

export function sumTierReviewView(view: TierReviewView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedVersion + parsedGraceDays + parsedRetries;
}
