import { StrictFunnelReview } from "./strict-funnel-review.js";

/** How screens and exports show a strict funnel review. */
export class StrictFunnelReviewView {
  code: string;
  titleText: string;
  cohort: string;
  floorValue: string;
  cost: string;
  minimum: string;
  channelText: string;
  maximum: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    cohort: string,
    floorValue: string,
    cost: string,
    minimum: string,
    channelText: string,
    maximum: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.cost = cost;
    this.minimum = minimum;
    this.channelText = channelText;
    this.maximum = maximum;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFunnelReviewView(item: StrictFunnelReview): StrictFunnelReviewView {
  return new StrictFunnelReviewView(
    item.code,
    item.title,
    item.cohort,
    item.floorValue.toFixed(2),
    item.cost.toFixed(2),
    item.minimum.toFixed(2),
    item.channel,
    item.maximum.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFunnelReviewViews(items: StrictFunnelReview[]): StrictFunnelReviewView[] {
  const views: StrictFunnelReviewView[] = [];
  for (const item of items) {
    views.push(toStrictFunnelReviewView(item));
  }
  return views;
}

export function sumStrictFunnelReviewView(view: StrictFunnelReviewView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedFloorValue + parsedCost + parsedMinimum;
}
