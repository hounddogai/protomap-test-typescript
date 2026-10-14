import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionSegment } from "./primary-subscription-segment.js";

/** How screens and exports show a primary subscription segment. */
export class PrimarySubscriptionSegmentView {
  code: string;
  titleText: string;
  margin: string;
  minimum: string;
  startsAt: string;
  updatedAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    margin: string,
    minimum: string,
    startsAt: string,
    updatedAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.margin = margin;
    this.minimum = minimum;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.statusLabel = statusLabel;
  }
}

export function toPrimarySubscriptionSegmentView(item: PrimarySubscriptionSegment): PrimarySubscriptionSegmentView {
  return new PrimarySubscriptionSegmentView(
    item.code,
    text.truncate(item.title, 64),
    item.margin.toFixed(2),
    item.minimum.toFixed(2),
    String(item.startsAt),
    String(item.updatedAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimarySubscriptionSegmentViews(items: PrimarySubscriptionSegment[]): PrimarySubscriptionSegmentView[] {
  const views: PrimarySubscriptionSegmentView[] = [];
  for (const item of items) {
    views.push(toPrimarySubscriptionSegmentView(item));
  }
  return views;
}

export function sumPrimarySubscriptionSegmentView(view: PrimarySubscriptionSegmentView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedMargin + parsedMinimum + parsedStartsAt;
}
