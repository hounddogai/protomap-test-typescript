import * as text from "../../../../kit/text.js";
import { ManualPacingReview } from "./manual-pacing-review.js";

/** How screens and exports show a manual pacing review. */
export class ManualPacingReviewView {
  code: string;
  label: string;
  descriptionText: string;
  ratio: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    descriptionText: string,
    ratio: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.descriptionText = descriptionText;
    this.ratio = ratio;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toManualPacingReviewView(item: ManualPacingReview): ManualPacingReviewView {
  return new ManualPacingReviewView(
    item.code,
    item.label,
    item.description,
    item.ratio.toFixed(2),
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualPacingReviewViews(items: ManualPacingReview[]): ManualPacingReviewView[] {
  const views: ManualPacingReviewView[] = [];
  for (const item of items) {
    views.push(toManualPacingReviewView(item));
  }
  return views;
}

export function sumManualPacingReviewView(view: ManualPacingReviewView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
