import * as text from "../../../../kit/text.js";
import { PendingPostReview } from "./pending-post-review.js";

/** How screens and exports show a pending post review. */
export class PendingPostReviewView {
  code: string;
  title: string;
  score: string;
  priority: string;
  summary: string;
  category: string;
  durationMinutesText: string;
  ceilingText: string;
  frequencyCap: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    score: string,
    priority: string,
    summary: string,
    category: string,
    durationMinutesText: string,
    ceilingText: string,
    frequencyCap: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.priority = priority;
    this.summary = summary;
    this.category = category;
    this.durationMinutesText = durationMinutesText;
    this.ceilingText = ceilingText;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toPendingPostReviewView(item: PendingPostReview): PendingPostReviewView {
  return new PendingPostReviewView(
    item.code,
    item.title,
    item.score.toFixed(2),
    String(item.priority),
    item.summary,
    text.truncate(item.category, 40),
    String(item.durationMinutes),
    item.ceiling.toFixed(2),
    String(item.frequencyCap),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingPostReviewViews(items: PendingPostReview[]): PendingPostReviewView[] {
  const views: PendingPostReviewView[] = [];
  for (const item of items) {
    views.push(toPendingPostReviewView(item));
  }
  return views;
}

export function sumPendingPostReviewView(view: PendingPostReviewView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  return parsedScore + parsedPriority + parsedDurationMinutes;
}
