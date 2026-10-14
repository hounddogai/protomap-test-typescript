import { OptOutReview } from "./opt-out-review.js";

/** How screens and exports show a opt out review. */
export class OptOutReviewView {
  codeText: string;
  title: string;
  impressionsText: string;
  region: string;
  openRateText: string;
  priority: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    impressionsText: string,
    region: string,
    openRateText: string,
    priority: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.impressionsText = impressionsText;
    this.region = region;
    this.openRateText = openRateText;
    this.priority = priority;
    this.statusLabel = statusLabel;
  }
}

export function toOptOutReviewView(item: OptOutReview): OptOutReviewView {
  return new OptOutReviewView(
    item.code,
    item.title,
    String(item.impressions),
    item.region,
    item.openRate.toFixed(2),
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toOptOutReviewViews(items: OptOutReview[]): OptOutReviewView[] {
  const views: OptOutReviewView[] = [];
  for (const item of items) {
    views.push(toOptOutReviewView(item));
  }
  return views;
}

export function sumOptOutReviewView(view: OptOutReviewView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedImpressions + parsedOpenRate + parsedPriority;
}
