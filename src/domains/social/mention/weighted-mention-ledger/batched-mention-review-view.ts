import * as text from "../../../../kit/text.js";
import { BatchedMentionReview } from "./batched-mention-review.js";

/** How screens and exports show a batched mention review. */
export class BatchedMentionReviewView {
  code: string;
  title: string;
  phoneText: string;
  source: string;
  locale: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    phoneText: string,
    source: string,
    locale: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.phoneText = phoneText;
    this.source = source;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toBatchedMentionReviewView(item: BatchedMentionReview): BatchedMentionReviewView {
  return new BatchedMentionReviewView(
    text.truncate(item.code, 80),
    item.title,
    item.phone,
    item.source,
    item.locale,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toBatchedMentionReviewViews(items: BatchedMentionReview[]): BatchedMentionReviewView[] {
  const views: BatchedMentionReviewView[] = [];
  for (const item of items) {
    views.push(toBatchedMentionReviewView(item));
  }
  return views;
}

export function sumBatchedMentionReviewView(view: BatchedMentionReviewView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedFrequencyCap;
}
