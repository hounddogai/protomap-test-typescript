import * as text from "../../../../kit/text.js";
import { NudgeReview } from "./nudge-review.js";

/** How screens and exports show a nudge review. */
export class NudgeReviewView {
  code: string;
  titleText: string;
  batchSizeText: string;
  channel: string;
  budgetText: string;
  ceiling: string;
  priority: string;
  graceDays: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    batchSizeText: string,
    channel: string,
    budgetText: string,
    ceiling: string,
    priority: string,
    graceDays: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.batchSizeText = batchSizeText;
    this.channel = channel;
    this.budgetText = budgetText;
    this.ceiling = ceiling;
    this.priority = priority;
    this.graceDays = graceDays;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeReviewView(item: NudgeReview): NudgeReviewView {
  return new NudgeReviewView(
    item.code,
    text.truncate(item.title, 40),
    String(item.batchSize),
    text.truncate(item.channel, 64),
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    String(item.priority),
    String(item.graceDays),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeReviewViews(items: NudgeReview[]): NudgeReviewView[] {
  const views: NudgeReviewView[] = [];
  for (const item of items) {
    views.push(toNudgeReviewView(item));
  }
  return views;
}

export function sumNudgeReviewView(view: NudgeReviewView): number {
  const parsedBatchSize = Number(view.batchSizeText);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSizeText} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedBatchSize + parsedBudget + parsedCeiling;
}
