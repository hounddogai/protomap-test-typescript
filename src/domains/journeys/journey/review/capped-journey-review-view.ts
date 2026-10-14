import { CappedJourneyReview } from "./capped-journey-review.js";

/** How screens and exports show a capped journey review. */
export class CappedJourneyReviewView {
  code: string;
  titleText: string;
  costText: string;
  clicksText: string;
  margin: string;
  durationMinutes: string;
  openRateText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    costText: string,
    clicksText: string,
    margin: string,
    durationMinutes: string,
    openRateText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.costText = costText;
    this.clicksText = clicksText;
    this.margin = margin;
    this.durationMinutes = durationMinutes;
    this.openRateText = openRateText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toCappedJourneyReviewView(item: CappedJourneyReview): CappedJourneyReviewView {
  return new CappedJourneyReviewView(
    item.code,
    item.title,
    item.cost.toFixed(2),
    String(item.clicks),
    item.margin.toFixed(2),
    String(item.durationMinutes),
    item.openRate.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedJourneyReviewViews(items: CappedJourneyReview[]): CappedJourneyReviewView[] {
  const views: CappedJourneyReviewView[] = [];
  for (const item of items) {
    views.push(toCappedJourneyReviewView(item));
  }
  return views;
}

export function sumCappedJourneyReviewView(view: CappedJourneyReviewView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedCost + parsedClicks + parsedMargin;
}
