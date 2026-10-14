import { RollingCreativeReview } from "./rolling-creative-review.js";

/** How screens and exports show a rolling creative review. */
export class RollingCreativeReviewView {
  code: string;
  label: string;
  floorValue: string;
  graceDaysText: string;
  openRate: string;
  weightText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    graceDaysText: string,
    openRate: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.graceDaysText = graceDaysText;
    this.openRate = openRate;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingCreativeReviewView(item: RollingCreativeReview): RollingCreativeReviewView {
  return new RollingCreativeReviewView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    String(item.graceDays),
    item.openRate.toFixed(2),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingCreativeReviewViews(items: RollingCreativeReview[]): RollingCreativeReviewView[] {
  const views: RollingCreativeReviewView[] = [];
  for (const item of items) {
    views.push(toRollingCreativeReviewView(item));
  }
  return views;
}

export function sumRollingCreativeReviewView(view: RollingCreativeReviewView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedFloorValue + parsedGraceDays + parsedOpenRate;
}
