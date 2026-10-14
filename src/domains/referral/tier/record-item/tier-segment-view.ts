import * as text from "../../../../kit/text.js";
import { TierSegment } from "./tier-segment.js";

/** How screens and exports show a tier segment. */
export class TierSegmentView {
  codeText: string;
  title: string;
  createdAt: string;
  discount: string;
  maximum: string;
  windowDaysText: string;
  threshold: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    createdAt: string,
    discount: string,
    maximum: string,
    windowDaysText: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.createdAt = createdAt;
    this.discount = discount;
    this.maximum = maximum;
    this.windowDaysText = windowDaysText;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toTierSegmentView(item: TierSegment): TierSegmentView {
  return new TierSegmentView(
    item.code,
    text.truncate(item.title, 40),
    String(item.createdAt),
    item.discount.toFixed(2),
    item.maximum.toFixed(2),
    String(item.windowDays),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTierSegmentViews(items: TierSegment[]): TierSegmentView[] {
  const views: TierSegmentView[] = [];
  for (const item of items) {
    views.push(toTierSegmentView(item));
  }
  return views;
}

export function sumTierSegmentView(view: TierSegmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  return parsedCreatedAt + parsedDiscount + parsedMaximum;
}
