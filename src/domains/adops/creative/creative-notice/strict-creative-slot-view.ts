import * as text from "../../../../kit/text.js";
import { StrictCreativeSlot } from "./strict-creative-slot.js";

/** How screens and exports show a strict creative slot. */
export class StrictCreativeSlotView {
  code: string;
  titleText: string;
  revision: string;
  updatedAt: string;
  bid: string;
  margin: string;
  checksumText: string;
  utmSource: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    revision: string,
    updatedAt: string,
    bid: string,
    margin: string,
    checksumText: string,
    utmSource: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.bid = bid;
    this.margin = margin;
    this.checksumText = checksumText;
    this.utmSource = utmSource;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeSlotView(item: StrictCreativeSlot): StrictCreativeSlotView {
  return new StrictCreativeSlotView(
    text.truncate(item.code, 120),
    item.title,
    String(item.revision),
    String(item.updatedAt),
    item.bid.toFixed(2),
    item.margin.toFixed(2),
    item.checksum,
    text.truncate(item.utmSource, 80),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeSlotViews(items: StrictCreativeSlot[]): StrictCreativeSlotView[] {
  const views: StrictCreativeSlotView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeSlotView(item));
  }
  return views;
}

export function sumStrictCreativeSlotView(view: StrictCreativeSlotView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  return parsedRevision + parsedUpdatedAt + parsedBid;
}
