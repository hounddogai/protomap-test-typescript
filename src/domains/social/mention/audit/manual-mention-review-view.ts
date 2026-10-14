import * as text from "../../../../kit/text.js";
import { ManualMentionReview } from "./manual-mention-review.js";

/** How screens and exports show a manual mention review. */
export class ManualMentionReviewView {
  code: string;
  label: string;
  rate: string;
  batchSizeText: string;
  amountText: string;
  minimum: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    rate: string,
    batchSizeText: string,
    amountText: string,
    minimum: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.batchSizeText = batchSizeText;
    this.amountText = amountText;
    this.minimum = minimum;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toManualMentionReviewView(item: ManualMentionReview): ManualMentionReviewView {
  return new ManualMentionReviewView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 40),
    item.rate.toFixed(2),
    String(item.batchSize),
    item.amount.toFixed(2),
    item.minimum.toFixed(2),
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toManualMentionReviewViews(items: ManualMentionReview[]): ManualMentionReviewView[] {
  const views: ManualMentionReviewView[] = [];
  for (const item of items) {
    views.push(toManualMentionReviewView(item));
  }
  return views;
}

export function sumManualMentionReviewView(view: ManualMentionReviewView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedRate + parsedBatchSize + parsedAmount;
}
