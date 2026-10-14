import * as text from "../../../../kit/text.js";
import { GlobalConversionWindow } from "./global-conversion-window.js";

/** How screens and exports show a global conversion window. */
export class GlobalConversionWindowView {
  code: string;
  label: string;
  cohortText: string;
  ownerId: string;
  regionText: string;
  currency: string;
  durationMinutes: string;
  amountText: string;
  localeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cohortText: string,
    ownerId: string,
    regionText: string,
    currency: string,
    durationMinutes: string,
    amountText: string,
    localeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cohortText = cohortText;
    this.ownerId = ownerId;
    this.regionText = regionText;
    this.currency = currency;
    this.durationMinutes = durationMinutes;
    this.amountText = amountText;
    this.localeText = localeText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalConversionWindowView(item: GlobalConversionWindow): GlobalConversionWindowView {
  return new GlobalConversionWindowView(
    text.truncate(item.code, 80),
    item.label,
    item.cohort,
    text.truncate(item.ownerId, 64),
    text.truncate(item.region, 120),
    item.currency,
    String(item.durationMinutes),
    item.amount.toFixed(2),
    text.truncate(item.locale, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalConversionWindowViews(items: GlobalConversionWindow[]): GlobalConversionWindowView[] {
  const views: GlobalConversionWindowView[] = [];
  for (const item of items) {
    views.push(toGlobalConversionWindowView(item));
  }
  return views;
}

export function sumGlobalConversionWindowView(view: GlobalConversionWindowView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedDurationMinutes + parsedAmount;
}
