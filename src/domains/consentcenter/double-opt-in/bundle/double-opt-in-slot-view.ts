import * as text from "../../../../kit/text.js";
import { DoubleOptInSlot } from "./double-opt-in-slot.js";

/** How screens and exports show a double opt in slot. */
export class DoubleOptInSlotView {
  code: string;
  label: string;
  sendAt: string;
  windowDaysText: string;
  titleText: string;
  channel: string;
  segment: string;
  minimum: string;
  active: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    sendAt: string,
    windowDaysText: string,
    titleText: string,
    channel: string,
    segment: string,
    minimum: string,
    active: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.windowDaysText = windowDaysText;
    this.titleText = titleText;
    this.channel = channel;
    this.segment = segment;
    this.minimum = minimum;
    this.active = active;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInSlotView(item: DoubleOptInSlot): DoubleOptInSlotView {
  return new DoubleOptInSlotView(
    item.code,
    text.truncate(item.label, 64),
    String(item.sendAt),
    String(item.windowDays),
    item.title,
    item.channel,
    item.segment,
    item.minimum.toFixed(2),
    `${item.active}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInSlotViews(items: DoubleOptInSlot[]): DoubleOptInSlotView[] {
  const views: DoubleOptInSlotView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInSlotView(item));
  }
  return views;
}

export function sumDoubleOptInSlotView(view: DoubleOptInSlotView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedSendAt + parsedWindowDays + parsedMinimum;
}
