import * as text from "../../../../kit/text.js";
import { WeightedRewardReview } from "./weighted-reward-review.js";

/** How screens and exports show a weighted reward review. */
export class WeightedRewardReviewView {
  code: string;
  titleText: string;
  minimumText: string;
  revision: string;
  checksumText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    minimumText: string,
    revision: string,
    checksumText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.minimumText = minimumText;
    this.revision = revision;
    this.checksumText = checksumText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedRewardReviewView(item: WeightedRewardReview): WeightedRewardReviewView {
  return new WeightedRewardReviewView(
    item.code,
    item.title,
    item.minimum.toFixed(2),
    String(item.revision),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedRewardReviewViews(items: WeightedRewardReview[]): WeightedRewardReviewView[] {
  const views: WeightedRewardReviewView[] = [];
  for (const item of items) {
    views.push(toWeightedRewardReviewView(item));
  }
  return views;
}

export function sumWeightedRewardReviewView(view: WeightedRewardReviewView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedMinimum + parsedRevision;
}
