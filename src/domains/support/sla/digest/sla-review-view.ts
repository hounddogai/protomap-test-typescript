import * as text from "../../../../kit/text.js";
import { SlaReview } from "./sla-review.js";

/** How screens and exports show a sla review. */
export class SlaReviewView {
  code: string;
  label: string;
  minimum: string;
  ratio: string;
  ownerId: string;
  approved: string;
  category: string;
  notes: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    ratio: string,
    ownerId: string,
    approved: string,
    category: string,
    notes: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.ratio = ratio;
    this.ownerId = ownerId;
    this.approved = approved;
    this.category = category;
    this.notes = notes;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toSlaReviewView(item: SlaReview): SlaReviewView {
  return new SlaReviewView(
    item.code,
    item.label,
    item.minimum.toFixed(2),
    item.ratio.toFixed(2),
    item.ownerId,
    `${item.approved}`,
    text.truncate(item.category, 40),
    item.notes,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaReviewViews(items: SlaReview[]): SlaReviewView[] {
  const views: SlaReviewView[] = [];
  for (const item of items) {
    views.push(toSlaReviewView(item));
  }
  return views;
}

export function sumSlaReviewView(view: SlaReviewView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedMinimum + parsedRatio;
}
