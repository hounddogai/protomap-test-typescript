import * as text from "../../../../kit/text.js";
import { PlacementEntry } from "./placement-entry.js";

/** How screens and exports show a placement entry. */
export class PlacementEntryView {
  code: string;
  titleText: string;
  pinned: string;
  graceDays: string;
  clicks: string;
  channel: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    graceDays: string,
    clicks: string,
    channel: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.graceDays = graceDays;
    this.clicks = clicks;
    this.channel = channel;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementEntryView(item: PlacementEntry): PlacementEntryView {
  return new PlacementEntryView(
    item.code,
    item.title,
    `${item.pinned}`,
    String(item.graceDays),
    String(item.clicks),
    text.truncate(item.channel, 40),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementEntryViews(items: PlacementEntry[]): PlacementEntryView[] {
  const views: PlacementEntryView[] = [];
  for (const item of items) {
    views.push(toPlacementEntryView(item));
  }
  return views;
}

export function sumPlacementEntryView(view: PlacementEntryView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedGraceDays + parsedClicks;
}
