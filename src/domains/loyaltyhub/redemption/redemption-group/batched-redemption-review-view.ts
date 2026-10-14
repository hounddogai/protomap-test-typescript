import * as text from "../../../../kit/text.js";
import { BatchedRedemptionReview } from "./batched-redemption-review.js";

/** How screens and exports show a batched redemption review. */
export class BatchedRedemptionReviewView {
  code: string;
  nameText: string;
  scoreText: string;
  sendAtText: string;
  label: string;
  unit: string;
  locale: string;
  sourceText: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    scoreText: string,
    sendAtText: string,
    label: string,
    unit: string,
    locale: string,
    sourceText: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.scoreText = scoreText;
    this.sendAtText = sendAtText;
    this.label = label;
    this.unit = unit;
    this.locale = locale;
    this.sourceText = sourceText;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedRedemptionReviewView(item: BatchedRedemptionReview): BatchedRedemptionReviewView {
  return new BatchedRedemptionReviewView(
    item.code,
    text.truncate(item.name, 120),
    item.score.toFixed(2),
    String(item.sendAt),
    item.label,
    item.unit,
    item.locale,
    item.source,
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedRedemptionReviewViews(items: BatchedRedemptionReview[]): BatchedRedemptionReviewView[] {
  const views: BatchedRedemptionReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedRedemptionReviewView(item));
  }
  return views;
}

export function sumBatchedRedemptionReviewView(view: BatchedRedemptionReviewView): number {
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedScore + parsedSendAt + parsedCeiling;
}
