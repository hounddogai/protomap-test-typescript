import * as text from "../../../../kit/text.js";
import { LenientComplaintReview } from "./lenient-complaint-review.js";

/** How screens and exports show a lenient complaint review. */
export class LenientComplaintReviewView {
  code: string;
  titleText: string;
  localeText: string;
  endsAt: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    localeText: string,
    endsAt: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.localeText = localeText;
    this.endsAt = endsAt;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toLenientComplaintReviewView(item: LenientComplaintReview): LenientComplaintReviewView {
  return new LenientComplaintReviewView(
    text.truncate(item.code, 120),
    text.truncate(item.title, 40),
    item.locale,
    String(item.endsAt),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientComplaintReviewViews(items: LenientComplaintReview[]): LenientComplaintReviewView[] {
  const views: LenientComplaintReviewView[] = [];
  for (const item of items) {
    views.push(toLenientComplaintReviewView(item));
  }
  return views;
}

export function sumLenientComplaintReviewView(view: LenientComplaintReviewView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedEndsAt + parsedMinimum;
}
