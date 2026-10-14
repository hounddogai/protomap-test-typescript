import * as text from "../../../../kit/text.js";
import { ComplaintSlot } from "./complaint-slot.js";

/** How screens and exports show a complaint slot. */
export class ComplaintSlotView {
  codeText: string;
  title: string;
  localeText: string;
  timezone: string;
  amount: string;
  channel: string;
  capacityText: string;
  margin: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    localeText: string,
    timezone: string,
    amount: string,
    channel: string,
    capacityText: string,
    margin: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.localeText = localeText;
    this.timezone = timezone;
    this.amount = amount;
    this.channel = channel;
    this.capacityText = capacityText;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintSlotView(item: ComplaintSlot): ComplaintSlotView {
  return new ComplaintSlotView(
    item.code,
    item.title,
    item.locale,
    item.timezone,
    item.amount.toFixed(2),
    text.truncate(item.channel, 40),
    String(item.capacity),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintSlotViews(items: ComplaintSlot[]): ComplaintSlotView[] {
  const views: ComplaintSlotView[] = [];
  for (const item of items) {
    views.push(toComplaintSlotView(item));
  }
  return views;
}

export function sumComplaintSlotView(view: ComplaintSlotView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  return parsedAmount + parsedCapacity + parsedMargin;
}
