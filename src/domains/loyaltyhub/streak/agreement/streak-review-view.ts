import * as text from "../../../../kit/text.js";
import { StreakReview } from "./streak-review.js";

/** How screens and exports show a streak review. */
export class StreakReviewView {
  code: string;
  name: string;
  margin: string;
  pinnedText: string;
  expiresAt: string;
  priority: string;
  budget: string;
  updatedAtText: string;
  channelText: string;
  campaignRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    pinnedText: string,
    expiresAt: string,
    priority: string,
    budget: string,
    updatedAtText: string,
    channelText: string,
    campaignRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.pinnedText = pinnedText;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.budget = budget;
    this.updatedAtText = updatedAtText;
    this.channelText = channelText;
    this.campaignRef = campaignRef;
    this.statusLabel = statusLabel;
  }
}

export function toStreakReviewView(item: StreakReview): StreakReviewView {
  return new StreakReviewView(
    item.code,
    text.truncate(item.name, 64),
    item.margin.toFixed(2),
    `${item.pinned}`,
    String(item.expiresAt),
    String(item.priority),
    item.budget.toFixed(2),
    String(item.updatedAt),
    item.channel,
    text.truncate(item.campaignRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toStreakReviewViews(items: StreakReview[]): StreakReviewView[] {
  const views: StreakReviewView[] = [];
  for (const item of items) {
    views.push(toStreakReviewView(item));
  }
  return views;
}

export function sumStreakReviewView(view: StreakReviewView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMargin + parsedExpiresAt + parsedPriority;
}
