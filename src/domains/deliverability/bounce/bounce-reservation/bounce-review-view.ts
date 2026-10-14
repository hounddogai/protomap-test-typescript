import { BounceReview } from "./bounce-review.js";

/** How screens and exports show a bounce review. */
export class BounceReviewView {
  codeText: string;
  name: string;
  ownerId: string;
  maximumText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ownerId: string,
    maximumText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ownerId = ownerId;
    this.maximumText = maximumText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toBounceReviewView(item: BounceReview): BounceReviewView {
  return new BounceReviewView(
    item.code,
    item.name,
    item.ownerId,
    item.maximum.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toBounceReviewViews(items: BounceReview[]): BounceReviewView[] {
  const views: BounceReviewView[] = [];
  for (const item of items) {
    views.push(toBounceReviewView(item));
  }
  return views;
}

export function sumBounceReviewView(view: BounceReviewView): number {
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedMaximum + parsedWindowDays;
}
