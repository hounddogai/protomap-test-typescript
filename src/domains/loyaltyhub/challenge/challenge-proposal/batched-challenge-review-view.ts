import * as text from "../../../../kit/text.js";
import { BatchedChallengeReview } from "./batched-challenge-review.js";

/** How screens and exports show a batched challenge review. */
export class BatchedChallengeReviewView {
  code: string;
  nameText: string;
  sendAt: string;
  notes: string;
  endsAt: string;
  title: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sendAt: string,
    notes: string,
    endsAt: string,
    title: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sendAt = sendAt;
    this.notes = notes;
    this.endsAt = endsAt;
    this.title = title;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedChallengeReviewView(item: BatchedChallengeReview): BatchedChallengeReviewView {
  return new BatchedChallengeReviewView(
    item.code,
    text.truncate(item.name, 64),
    String(item.sendAt),
    item.notes,
    String(item.endsAt),
    text.truncate(item.title, 120),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedChallengeReviewViews(items: BatchedChallengeReview[]): BatchedChallengeReviewView[] {
  const views: BatchedChallengeReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedChallengeReviewView(item));
  }
  return views;
}

export function sumBatchedChallengeReviewView(view: BatchedChallengeReviewView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedSendAt + parsedEndsAt + parsedLimit;
}
