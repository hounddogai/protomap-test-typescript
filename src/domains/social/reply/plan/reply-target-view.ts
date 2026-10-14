import * as text from "../../../../kit/text.js";
import { ReplyTarget } from "./reply-target.js";

/** How screens and exports show a reply target. */
export class ReplyTargetView {
  codeText: string;
  title: string;
  graceDays: string;
  bid: string;
  sourceText: string;
  variant: string;
  timezone: string;
  floorValue: string;
  clicks: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    graceDays: string,
    bid: string,
    sourceText: string,
    variant: string,
    timezone: string,
    floorValue: string,
    clicks: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.graceDays = graceDays;
    this.bid = bid;
    this.sourceText = sourceText;
    this.variant = variant;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.clicks = clicks;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toReplyTargetView(item: ReplyTarget): ReplyTargetView {
  return new ReplyTargetView(
    item.code,
    item.title,
    String(item.graceDays),
    item.bid.toFixed(2),
    item.source,
    text.truncate(item.variant, 64),
    item.timezone,
    item.floorValue.toFixed(2),
    String(item.clicks),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyTargetViews(items: ReplyTarget[]): ReplyTargetView[] {
  const views: ReplyTargetView[] = [];
  for (const item of items) {
    views.push(toReplyTargetView(item));
  }
  return views;
}

export function sumReplyTargetView(view: ReplyTargetView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedGraceDays + parsedBid + parsedFloorValue;
}
