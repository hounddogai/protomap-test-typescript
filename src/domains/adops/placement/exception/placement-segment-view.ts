import * as text from "../../../../kit/text.js";
import { PlacementSegment } from "./placement-segment.js";

/** How screens and exports show a placement segment. */
export class PlacementSegmentView {
  code: string;
  titleText: string;
  createdAt: string;
  maximum: string;
  graceDays: string;
  durationMinutesText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    createdAt: string,
    maximum: string,
    graceDays: string,
    durationMinutesText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.createdAt = createdAt;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.durationMinutesText = durationMinutesText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementSegmentView(item: PlacementSegment): PlacementSegmentView {
  return new PlacementSegmentView(
    item.code,
    text.truncate(item.title, 40),
    String(item.createdAt),
    item.maximum.toFixed(2),
    String(item.graceDays),
    String(item.durationMinutes),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementSegmentViews(items: PlacementSegment[]): PlacementSegmentView[] {
  const views: PlacementSegmentView[] = [];
  for (const item of items) {
    views.push(toPlacementSegmentView(item));
  }
  return views;
}

export function sumPlacementSegmentView(view: PlacementSegmentView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedCreatedAt + parsedMaximum + parsedGraceDays;
}
