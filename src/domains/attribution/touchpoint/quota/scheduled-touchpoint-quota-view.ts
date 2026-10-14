import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointQuota } from "./scheduled-touchpoint-quota.js";

/** How screens and exports show a scheduled touchpoint quota. */
export class ScheduledTouchpointQuotaView {
  code: string;
  label: string;
  graceDays: string;
  minimumText: string;
  weightText: string;
  priority: string;
  name: string;
  phone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    graceDays: string,
    minimumText: string,
    weightText: string,
    priority: string,
    name: string,
    phone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.minimumText = minimumText;
    this.weightText = weightText;
    this.priority = priority;
    this.name = name;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledTouchpointQuotaView(item: ScheduledTouchpointQuota): ScheduledTouchpointQuotaView {
  return new ScheduledTouchpointQuotaView(
    item.code,
    text.truncate(item.label, 40),
    String(item.graceDays),
    item.minimum.toFixed(2),
    item.weight.toFixed(2),
    String(item.priority),
    item.name,
    text.truncate(item.phone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledTouchpointQuotaViews(items: ScheduledTouchpointQuota[]): ScheduledTouchpointQuotaView[] {
  const views: ScheduledTouchpointQuotaView[] = [];
  for (const item of items) {
    views.push(toScheduledTouchpointQuotaView(item));
  }
  return views;
}

export function sumScheduledTouchpointQuotaView(view: ScheduledTouchpointQuotaView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedGraceDays + parsedMinimum + parsedWeight;
}
