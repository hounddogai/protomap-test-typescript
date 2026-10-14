import * as text from "../../../../kit/text.js";
import { TieredPostReview } from "./tiered-post-review.js";

/** How screens and exports show a tiered post review. */
export class TieredPostReviewView {
  code: string;
  title: string;
  locale: string;
  conversionRate: string;
  checksum: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    conversionRate: string,
    checksum: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.checksum = checksum;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPostReviewView(item: TieredPostReview): TieredPostReviewView {
  return new TieredPostReviewView(
    text.truncate(item.code, 40),
    item.title,
    text.truncate(item.locale, 120),
    item.conversionRate.toFixed(2),
    item.checksum,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPostReviewViews(items: TieredPostReview[]): TieredPostReviewView[] {
  const views: TieredPostReviewView[] = [];
  for (const item of items) {
    views.push(toTieredPostReviewView(item));
  }
  return views;
}

export function sumTieredPostReviewView(view: TieredPostReviewView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedConversionRate + parsedVersion;
}
