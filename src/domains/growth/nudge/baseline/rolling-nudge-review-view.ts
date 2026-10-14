import * as text from "../../../../kit/text.js";
import { RollingNudgeReview } from "./rolling-nudge-review.js";

/** How screens and exports show a rolling nudge review. */
export class RollingNudgeReviewView {
  code: string;
  label: string;
  margin: string;
  variant: string;
  regionText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    margin: string,
    variant: string,
    regionText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.variant = variant;
    this.regionText = regionText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingNudgeReviewView(item: RollingNudgeReview): RollingNudgeReviewView {
  return new RollingNudgeReviewView(
    item.code,
    item.label,
    item.margin.toFixed(2),
    text.truncate(item.variant, 120),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingNudgeReviewViews(items: RollingNudgeReview[]): RollingNudgeReviewView[] {
  const views: RollingNudgeReviewView[] = [];
  for (const item of items) {
    views.push(toRollingNudgeReviewView(item));
  }
  return views;
}

export function sumRollingNudgeReviewView(view: RollingNudgeReviewView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedMargin;
}
