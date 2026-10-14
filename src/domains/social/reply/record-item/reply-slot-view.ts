import * as text from "../../../../kit/text.js";
import { ReplySlot } from "./reply-slot.js";

/** How screens and exports show a reply slot. */
export class ReplySlotView {
  code: string;
  title: string;
  bid: string;
  source: string;
  checksum: string;
  floorValue: string;
  pinned: string;
  categoryText: string;
  utmSource: string;
  timezone: string;
  threshold: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    bid: string,
    source: string,
    checksum: string,
    floorValue: string,
    pinned: string,
    categoryText: string,
    utmSource: string,
    timezone: string,
    threshold: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.source = source;
    this.checksum = checksum;
    this.floorValue = floorValue;
    this.pinned = pinned;
    this.categoryText = categoryText;
    this.utmSource = utmSource;
    this.timezone = timezone;
    this.threshold = threshold;
    this.statusLabel = statusLabel;
  }
}

export function toReplySlotView(item: ReplySlot): ReplySlotView {
  return new ReplySlotView(
    item.code,
    item.title,
    item.bid.toFixed(2),
    item.source,
    item.checksum,
    item.floorValue.toFixed(2),
    `${item.pinned}`,
    text.truncate(item.category, 40),
    item.utmSource,
    item.timezone,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplySlotViews(items: ReplySlot[]): ReplySlotView[] {
  const views: ReplySlotView[] = [];
  for (const item of items) {
    views.push(toReplySlotView(item));
  }
  return views;
}

export function sumReplySlotView(view: ReplySlotView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedBid + parsedFloorValue + parsedThreshold;
}
