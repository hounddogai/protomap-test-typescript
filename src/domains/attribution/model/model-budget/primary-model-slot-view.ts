import * as text from "../../../../kit/text.js";
import { PrimaryModelSlot } from "./primary-model-slot.js";

/** How screens and exports show a primary model slot. */
export class PrimaryModelSlotView {
  code: string;
  name: string;
  locale: string;
  bidText: string;
  startsAt: string;
  campaignRef: string;
  unitText: string;
  channel: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    locale: string,
    bidText: string,
    startsAt: string,
    campaignRef: string,
    unitText: string,
    channel: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.bidText = bidText;
    this.startsAt = startsAt;
    this.campaignRef = campaignRef;
    this.unitText = unitText;
    this.channel = channel;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryModelSlotView(item: PrimaryModelSlot): PrimaryModelSlotView {
  return new PrimaryModelSlotView(
    item.code,
    item.name,
    item.locale,
    item.bid.toFixed(2),
    String(item.startsAt),
    text.truncate(item.campaignRef, 64),
    item.unit,
    text.truncate(item.channel, 40),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryModelSlotViews(items: PrimaryModelSlot[]): PrimaryModelSlotView[] {
  const views: PrimaryModelSlotView[] = [];
  for (const item of items) {
    views.push(toPrimaryModelSlotView(item));
  }
  return views;
}

export function sumPrimaryModelSlotView(view: PrimaryModelSlotView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedBid + parsedStartsAt;
}
