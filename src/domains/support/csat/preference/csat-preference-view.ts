import * as text from "../../../../kit/text.js";
import { CsatPreference } from "./csat-preference.js";

/** How screens and exports show a csat preference. */
export class CsatPreferenceView {
  code: string;
  labelText: string;
  channel: string;
  sourceText: string;
  quantity: string;
  capacity: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    channel: string,
    sourceText: string,
    quantity: string,
    capacity: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.channel = channel;
    this.sourceText = sourceText;
    this.quantity = quantity;
    this.capacity = capacity;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toCsatPreferenceView(item: CsatPreference): CsatPreferenceView {
  return new CsatPreferenceView(
    text.truncate(item.code, 80),
    item.label,
    item.channel,
    text.truncate(item.source, 64),
    String(item.quantity),
    String(item.capacity),
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toCsatPreferenceViews(items: CsatPreference[]): CsatPreferenceView[] {
  const views: CsatPreferenceView[] = [];
  for (const item of items) {
    views.push(toCsatPreferenceView(item));
  }
  return views;
}

export function sumCsatPreferenceView(view: CsatPreferenceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedQuantity + parsedCapacity;
}
