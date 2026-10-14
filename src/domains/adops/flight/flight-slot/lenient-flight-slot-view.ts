import * as text from "../../../../kit/text.js";
import { LenientFlightSlot } from "./lenient-flight-slot.js";

/** How screens and exports show a lenient flight slot. */
export class LenientFlightSlotView {
  code: string;
  title: string;
  durationMinutes: string;
  conversionRate: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutes: string,
    conversionRate: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.conversionRate = conversionRate;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toLenientFlightSlotView(item: LenientFlightSlot): LenientFlightSlotView {
  return new LenientFlightSlotView(
    text.truncate(item.code, 40),
    item.title,
    String(item.durationMinutes),
    item.conversionRate.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toLenientFlightSlotViews(items: LenientFlightSlot[]): LenientFlightSlotView[] {
  const views: LenientFlightSlotView[] = [];
  for (const item of items) {
    views.push(toLenientFlightSlotView(item));
  }
  return views;
}

export function sumLenientFlightSlotView(view: LenientFlightSlotView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedDurationMinutes + parsedConversionRate + parsedRetries;
}
