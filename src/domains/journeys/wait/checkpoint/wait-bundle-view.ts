import * as text from "../../../../kit/text.js";
import { WaitBundle } from "./wait-bundle.js";

/** How screens and exports show a wait bundle. */
export class WaitBundleView {
  codeText: string;
  name: string;
  notesText: string;
  rate: string;
  startsAt: string;
  bid: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    notesText: string,
    rate: string,
    startsAt: string,
    bid: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.notesText = notesText;
    this.rate = rate;
    this.startsAt = startsAt;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toWaitBundleView(item: WaitBundle): WaitBundleView {
  return new WaitBundleView(
    text.truncate(item.code, 120),
    item.name,
    item.notes,
    item.rate.toFixed(2),
    String(item.startsAt),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitBundleViews(items: WaitBundle[]): WaitBundleView[] {
  const views: WaitBundleView[] = [];
  for (const item of items) {
    views.push(toWaitBundleView(item));
  }
  return views;
}

export function sumWaitBundleView(view: WaitBundleView): number {
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRate + parsedStartsAt + parsedBid;
}
