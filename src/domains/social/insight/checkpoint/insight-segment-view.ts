import * as text from "../../../../kit/text.js";
import { InsightSegment } from "./insight-segment.js";

/** How screens and exports show a insight segment. */
export class InsightSegmentView {
  codeText: string;
  titleText: string;
  description: string;
  minimum: string;
  discountText: string;
  cost: string;
  ceiling: string;
  region: string;
  createdAtText: string;
  updatedAtText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    description: string,
    minimum: string,
    discountText: string,
    cost: string,
    ceiling: string,
    region: string,
    createdAtText: string,
    updatedAtText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.description = description;
    this.minimum = minimum;
    this.discountText = discountText;
    this.cost = cost;
    this.ceiling = ceiling;
    this.region = region;
    this.createdAtText = createdAtText;
    this.updatedAtText = updatedAtText;
    this.statusLabel = statusLabel;
  }
}

export function toInsightSegmentView(item: InsightSegment): InsightSegmentView {
  return new InsightSegmentView(
    text.truncate(item.code, 64),
    item.title,
    text.truncate(item.description, 80),
    item.minimum.toFixed(2),
    item.discount.toFixed(2),
    item.cost.toFixed(2),
    item.ceiling.toFixed(2),
    item.region,
    String(item.createdAt),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightSegmentViews(items: InsightSegment[]): InsightSegmentView[] {
  const views: InsightSegmentView[] = [];
  for (const item of items) {
    views.push(toInsightSegmentView(item));
  }
  return views;
}

export function sumInsightSegmentView(view: InsightSegmentView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedMinimum + parsedDiscount + parsedCost;
}
