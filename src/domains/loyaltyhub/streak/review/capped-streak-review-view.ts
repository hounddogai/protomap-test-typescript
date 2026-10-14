import * as text from "../../../../kit/text.js";
import { CappedStreakReview } from "./capped-streak-review.js";

/** How screens and exports show a capped streak review. */
export class CappedStreakReviewView {
  code: string;
  label: string;
  graceDaysText: string;
  version: string;
  audienceId: string;
  discount: string;
  updatedAtText: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDaysText: string,
    version: string,
    audienceId: string,
    discount: string,
    updatedAtText: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDaysText = graceDaysText;
    this.version = version;
    this.audienceId = audienceId;
    this.discount = discount;
    this.updatedAtText = updatedAtText;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toCappedStreakReviewView(item: CappedStreakReview): CappedStreakReviewView {
  return new CappedStreakReviewView(
    text.truncate(item.code, 40),
    item.label,
    String(item.graceDays),
    String(item.version),
    item.audienceId,
    item.discount.toFixed(2),
    String(item.updatedAt),
    item.journeyId,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedStreakReviewViews(items: CappedStreakReview[]): CappedStreakReviewView[] {
  const views: CappedStreakReviewView[] = [];
  for (const item of items) {
    views.push(toCappedStreakReviewView(item));
  }
  return views;
}

export function sumCappedStreakReviewView(view: CappedStreakReviewView): number {
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedGraceDays + parsedVersion + parsedDiscount;
}
