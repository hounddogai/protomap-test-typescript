import * as text from "../../../../kit/text.js";
import { PlacementBaseline } from "./placement-baseline.js";

/** How screens and exports show a placement baseline. */
export class PlacementBaselineView {
  code: string;
  label: string;
  timezoneText: string;
  bid: string;
  durationMinutesText: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    timezoneText: string,
    bid: string,
    durationMinutesText: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.timezoneText = timezoneText;
    this.bid = bid;
    this.durationMinutesText = durationMinutesText;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementBaselineView(item: PlacementBaseline): PlacementBaselineView {
  return new PlacementBaselineView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 40),
    item.timezone,
    item.bid.toFixed(2),
    String(item.durationMinutes),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementBaselineViews(items: PlacementBaseline[]): PlacementBaselineView[] {
  const views: PlacementBaselineView[] = [];
  for (const item of items) {
    views.push(toPlacementBaselineView(item));
  }
  return views;
}

export function sumPlacementBaselineView(view: PlacementBaselineView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBid + parsedDurationMinutes + parsedRetries;
}
