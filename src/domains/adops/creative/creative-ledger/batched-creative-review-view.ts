import * as text from "../../../../kit/text.js";
import { BatchedCreativeReview } from "./batched-creative-review.js";

/** How screens and exports show a batched creative review. */
export class BatchedCreativeReviewView {
  codeText: string;
  titleText: string;
  startsAt: string;
  updatedAtText: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    startsAt: string,
    updatedAtText: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.startsAt = startsAt;
    this.updatedAtText = updatedAtText;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedCreativeReviewView(item: BatchedCreativeReview): BatchedCreativeReviewView {
  return new BatchedCreativeReviewView(
    item.code,
    item.title,
    String(item.startsAt),
    String(item.updatedAt),
    text.truncate(item.variant, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedCreativeReviewViews(items: BatchedCreativeReview[]): BatchedCreativeReviewView[] {
  const views: BatchedCreativeReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedCreativeReviewView(item));
  }
  return views;
}

export function sumBatchedCreativeReviewView(view: BatchedCreativeReviewView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedStartsAt + parsedUpdatedAt;
}
