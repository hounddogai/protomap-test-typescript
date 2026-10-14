import * as text from "../../../../kit/text.js";
import { DefaultWarmupReview } from "./default-warmup-review.js";

/** How screens and exports show a default warmup review. */
export class DefaultWarmupReviewView {
  code: string;
  label: string;
  batchSizeText: string;
  contactEmail: string;
  startsAtText: string;
  externalRefText: string;
  rate: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    batchSizeText: string,
    contactEmail: string,
    startsAtText: string,
    externalRefText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.batchSizeText = batchSizeText;
    this.contactEmail = contactEmail;
    this.startsAtText = startsAtText;
    this.externalRefText = externalRefText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWarmupReviewView(item: DefaultWarmupReview): DefaultWarmupReviewView {
  return new DefaultWarmupReviewView(
    item.code,
    text.truncate(item.label, 40),
    String(item.batchSize),
    item.contactEmail,
    String(item.startsAt),
    item.externalRef,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWarmupReviewViews(items: DefaultWarmupReview[]): DefaultWarmupReviewView[] {
  const views: DefaultWarmupReviewView[] = [];
  for (const item of items) {
    views.push(toDefaultWarmupReviewView(item));
  }
  return views;
}

export function sumDefaultWarmupReviewView(view: DefaultWarmupReviewView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedBatchSize + parsedStartsAt + parsedRate;
}
