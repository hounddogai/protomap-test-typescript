import * as text from "../../../../kit/text.js";
import { ScheduledMentionReview } from "./scheduled-mention-review.js";

/** How screens and exports show a scheduled mention review. */
export class ScheduledMentionReviewView {
  code: string;
  titleText: string;
  currency: string;
  revision: string;
  timezone: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    currency: string,
    revision: string,
    timezone: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.currency = currency;
    this.revision = revision;
    this.timezone = timezone;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledMentionReviewView(item: ScheduledMentionReview): ScheduledMentionReviewView {
  return new ScheduledMentionReviewView(
    item.code,
    item.title,
    text.truncate(item.currency, 64),
    String(item.revision),
    item.timezone,
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledMentionReviewViews(items: ScheduledMentionReview[]): ScheduledMentionReviewView[] {
  const views: ScheduledMentionReviewView[] = [];
  for (const item of items) {
    views.push(toScheduledMentionReviewView(item));
  }
  return views;
}

export function sumScheduledMentionReviewView(view: ScheduledMentionReviewView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedRevision;
}
