import * as text from "../../../../kit/text.js";
import { ScheduledOptOutException } from "./scheduled-opt-out-exception.js";

/** How screens and exports show a scheduled opt out exception. */
export class ScheduledOptOutExceptionView {
  codeText: string;
  titleText: string;
  quantity: string;
  floorValue: string;
  clicksText: string;
  ownerId: string;
  windowDays: string;
  channel: string;
  region: string;
  localeText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    quantity: string,
    floorValue: string,
    clicksText: string,
    ownerId: string,
    windowDays: string,
    channel: string,
    region: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.quantity = quantity;
    this.floorValue = floorValue;
    this.clicksText = clicksText;
    this.ownerId = ownerId;
    this.windowDays = windowDays;
    this.channel = channel;
    this.region = region;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledOptOutExceptionView(item: ScheduledOptOutException): ScheduledOptOutExceptionView {
  return new ScheduledOptOutExceptionView(
    item.code,
    text.truncate(item.title, 120),
    String(item.quantity),
    item.floorValue.toFixed(2),
    String(item.clicks),
    item.ownerId,
    String(item.windowDays),
    item.channel,
    item.region,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledOptOutExceptionViews(items: ScheduledOptOutException[]): ScheduledOptOutExceptionView[] {
  const views: ScheduledOptOutExceptionView[] = [];
  for (const item of items) {
    views.push(toScheduledOptOutExceptionView(item));
  }
  return views;
}

export function sumScheduledOptOutExceptionView(view: ScheduledOptOutExceptionView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedQuantity + parsedFloorValue + parsedClicks;
}
