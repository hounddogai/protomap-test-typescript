import * as text from "../../../../kit/text.js";
import { ScheduledTouchpointPreference } from "./scheduled-touchpoint-preference.js";

/** How screens and exports show a scheduled touchpoint preference. */
export class ScheduledTouchpointPreferenceView {
  code: string;
  name: string;
  quantity: string;
  contactEmail: string;
  capacityText: string;
  channel: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    quantity: string,
    contactEmail: string,
    capacityText: string,
    channel: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.contactEmail = contactEmail;
    this.capacityText = capacityText;
    this.channel = channel;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledTouchpointPreferenceView(item: ScheduledTouchpointPreference): ScheduledTouchpointPreferenceView {
  return new ScheduledTouchpointPreferenceView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 64),
    String(item.quantity),
    item.contactEmail,
    String(item.capacity),
    text.truncate(item.channel, 120),
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledTouchpointPreferenceViews(items: ScheduledTouchpointPreference[]): ScheduledTouchpointPreferenceView[] {
  const views: ScheduledTouchpointPreferenceView[] = [];
  for (const item of items) {
    views.push(toScheduledTouchpointPreferenceView(item));
  }
  return views;
}

export function sumScheduledTouchpointPreferenceView(view: ScheduledTouchpointPreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedQuantity + parsedCapacity + parsedThreshold;
}
