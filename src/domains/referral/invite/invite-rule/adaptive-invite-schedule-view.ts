import * as text from "../../../../kit/text.js";
import { AdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

/** How screens and exports show a adaptive invite schedule. */
export class AdaptiveInviteScheduleView {
  codeText: string;
  label: string;
  title: string;
  timezoneText: string;
  unit: string;
  utmSource: string;
  sendAt: string;
  minimum: string;
  quantityText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    title: string,
    timezoneText: string,
    unit: string,
    utmSource: string,
    sendAt: string,
    minimum: string,
    quantityText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.title = title;
    this.timezoneText = timezoneText;
    this.unit = unit;
    this.utmSource = utmSource;
    this.sendAt = sendAt;
    this.minimum = minimum;
    this.quantityText = quantityText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveInviteScheduleView(item: AdaptiveInviteSchedule): AdaptiveInviteScheduleView {
  return new AdaptiveInviteScheduleView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 120),
    item.title,
    item.timezone,
    item.unit,
    item.utmSource,
    String(item.sendAt),
    item.minimum.toFixed(2),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveInviteScheduleViews(items: AdaptiveInviteSchedule[]): AdaptiveInviteScheduleView[] {
  const views: AdaptiveInviteScheduleView[] = [];
  for (const item of items) {
    views.push(toAdaptiveInviteScheduleView(item));
  }
  return views;
}

export function sumAdaptiveInviteScheduleView(view: AdaptiveInviteScheduleView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedQuantity = Number(view.quantityText);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantityText} is not a number`);
  return parsedSendAt + parsedMinimum + parsedQuantity;
}
