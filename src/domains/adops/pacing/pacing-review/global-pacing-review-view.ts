import * as text from "../../../../kit/text.js";
import { GlobalPacingReview } from "./global-pacing-review.js";

/** How screens and exports show a global pacing review. */
export class GlobalPacingReviewView {
  code: string;
  title: string;
  externalRef: string;
  ratio: string;
  graceDays: string;
  updatedAt: string;
  budgetText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    ratio: string,
    graceDays: string,
    updatedAt: string,
    budgetText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.ratio = ratio;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.budgetText = budgetText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPacingReviewView(item: GlobalPacingReview): GlobalPacingReviewView {
  return new GlobalPacingReviewView(
    item.code,
    text.truncate(item.title, 40),
    item.externalRef,
    item.ratio.toFixed(2),
    String(item.graceDays),
    String(item.updatedAt),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPacingReviewViews(items: GlobalPacingReview[]): GlobalPacingReviewView[] {
  const views: GlobalPacingReviewView[] = [];
  for (const item of items) {
    views.push(toGlobalPacingReviewView(item));
  }
  return views;
}

export function sumGlobalPacingReviewView(view: GlobalPacingReviewView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  return parsedRatio + parsedGraceDays + parsedUpdatedAt;
}
