import * as text from "../../../../kit/text.js";
import { WaitManifest } from "./wait-manifest.js";

/** How screens and exports show a wait manifest. */
export class WaitManifestView {
  codeText: string;
  title: string;
  archived: string;
  bid: string;
  region: string;
  ceiling: string;
  windowDaysText: string;
  notesText: string;
  rate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    archived: string,
    bid: string,
    region: string,
    ceiling: string,
    windowDaysText: string,
    notesText: string,
    rate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.archived = archived;
    this.bid = bid;
    this.region = region;
    this.ceiling = ceiling;
    this.windowDaysText = windowDaysText;
    this.notesText = notesText;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toWaitManifestView(item: WaitManifest): WaitManifestView {
  return new WaitManifestView(
    item.code,
    text.truncate(item.title, 64),
    `${item.archived}`,
    item.bid.toFixed(2),
    item.region,
    item.ceiling.toFixed(2),
    String(item.windowDays),
    item.notes,
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitManifestViews(items: WaitManifest[]): WaitManifestView[] {
  const views: WaitManifestView[] = [];
  for (const item of items) {
    views.push(toWaitManifestView(item));
  }
  return views;
}

export function sumWaitManifestView(view: WaitManifestView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedBid + parsedCeiling + parsedWindowDays;
}
