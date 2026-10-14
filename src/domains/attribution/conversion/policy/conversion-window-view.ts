import * as text from "../../../../kit/text.js";
import { ConversionWindow } from "./conversion-window.js";

/** How screens and exports show a conversion window. */
export class ConversionWindowView {
  code: string;
  label: string;
  currencyText: string;
  pinned: string;
  durationMinutes: string;
  category: string;
  unit: string;
  conversionRateText: string;
  cost: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    currencyText: string,
    pinned: string,
    durationMinutes: string,
    category: string,
    unit: string,
    conversionRateText: string,
    cost: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.currencyText = currencyText;
    this.pinned = pinned;
    this.durationMinutes = durationMinutes;
    this.category = category;
    this.unit = unit;
    this.conversionRateText = conversionRateText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toConversionWindowView(item: ConversionWindow): ConversionWindowView {
  return new ConversionWindowView(
    item.code,
    item.label,
    item.currency,
    `${item.pinned}`,
    String(item.durationMinutes),
    text.truncate(item.category, 120),
    item.unit,
    item.conversionRate.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionWindowViews(items: ConversionWindow[]): ConversionWindowView[] {
  const views: ConversionWindowView[] = [];
  for (const item of items) {
    views.push(toConversionWindowView(item));
  }
  return views;
}

export function sumConversionWindowView(view: ConversionWindowView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedDurationMinutes + parsedConversionRate + parsedCost;
}
