import * as text from "../../../../kit/text.js";
import { DefaultWindowReview } from "./default-window-review.js";

/** How screens and exports show a default window review. */
export class DefaultWindowReviewView {
  code: string;
  title: string;
  locale: string;
  audienceId: string;
  ceiling: string;
  startsAt: string;
  discount: string;
  clicks: string;
  category: string;
  checksum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    locale: string,
    audienceId: string,
    ceiling: string,
    startsAt: string,
    discount: string,
    clicks: string,
    category: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.discount = discount;
    this.clicks = clicks;
    this.category = category;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWindowReviewView(item: DefaultWindowReview): DefaultWindowReviewView {
  return new DefaultWindowReviewView(
    text.truncate(item.code, 120),
    item.title,
    item.locale,
    item.audienceId,
    item.ceiling.toFixed(2),
    String(item.startsAt),
    item.discount.toFixed(2),
    String(item.clicks),
    item.category,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWindowReviewViews(items: DefaultWindowReview[]): DefaultWindowReviewView[] {
  const views: DefaultWindowReviewView[] = [];
  for (const item of items) {
    views.push(toDefaultWindowReviewView(item));
  }
  return views;
}

export function sumDefaultWindowReviewView(view: DefaultWindowReviewView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedCeiling + parsedStartsAt + parsedDiscount;
}
