import { WindowDigest } from "./window-digest.js";

/** How screens and exports show a window digest. */
export class WindowDigestView {
  code: string;
  name: string;
  durationMinutesText: string;
  variant: string;
  currency: string;
  graceDaysText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutesText: string,
    variant: string,
    currency: string,
    graceDaysText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutesText = durationMinutesText;
    this.variant = variant;
    this.currency = currency;
    this.graceDaysText = graceDaysText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toWindowDigestView(item: WindowDigest): WindowDigestView {
  return new WindowDigestView(
    item.code,
    item.name,
    String(item.durationMinutes),
    item.variant,
    item.currency,
    String(item.graceDays),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowDigestViews(items: WindowDigest[]): WindowDigestView[] {
  const views: WindowDigestView[] = [];
  for (const item of items) {
    views.push(toWindowDigestView(item));
  }
  return views;
}

export function sumWindowDigestView(view: WindowDigestView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedDurationMinutes + parsedGraceDays + parsedFloorValue;
}
