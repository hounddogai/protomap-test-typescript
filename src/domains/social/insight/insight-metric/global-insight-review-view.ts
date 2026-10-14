import * as text from "../../../../kit/text.js";
import { GlobalInsightReview } from "./global-insight-review.js";

/** How screens and exports show a global insight review. */
export class GlobalInsightReviewView {
  code: string;
  labelText: string;
  capacity: string;
  scoreText: string;
  region: string;
  startsAt: string;
  categoryText: string;
  visible: string;
  cohort: string;
  summaryText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    capacity: string,
    scoreText: string,
    region: string,
    startsAt: string,
    categoryText: string,
    visible: string,
    cohort: string,
    summaryText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.capacity = capacity;
    this.scoreText = scoreText;
    this.region = region;
    this.startsAt = startsAt;
    this.categoryText = categoryText;
    this.visible = visible;
    this.cohort = cohort;
    this.summaryText = summaryText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalInsightReviewView(item: GlobalInsightReview): GlobalInsightReviewView {
  return new GlobalInsightReviewView(
    item.code,
    item.label,
    String(item.capacity),
    item.score.toFixed(2),
    text.truncate(item.region, 120),
    String(item.startsAt),
    item.category,
    `${item.visible}`,
    item.cohort,
    text.truncate(item.summary, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalInsightReviewViews(items: GlobalInsightReview[]): GlobalInsightReviewView[] {
  const views: GlobalInsightReviewView[] = [];
  for (const item of items) {
    views.push(toGlobalInsightReviewView(item));
  }
  return views;
}

export function sumGlobalInsightReviewView(view: GlobalInsightReviewView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedScore = Number(view.scoreText);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.scoreText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCapacity + parsedScore + parsedStartsAt;
}
