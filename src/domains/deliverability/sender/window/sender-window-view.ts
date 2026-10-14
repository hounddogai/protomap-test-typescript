import * as text from "../../../../kit/text.js";
import { SenderWindow } from "./sender-window.js";

/** How screens and exports show a sender window. */
export class SenderWindowView {
  code: string;
  title: string;
  categoryText: string;
  conversionRateText: string;
  minimum: string;
  cost: string;
  durationMinutes: string;
  journeyId: string;
  openRateText: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    categoryText: string,
    conversionRateText: string,
    minimum: string,
    cost: string,
    durationMinutes: string,
    journeyId: string,
    openRateText: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.categoryText = categoryText;
    this.conversionRateText = conversionRateText;
    this.minimum = minimum;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.journeyId = journeyId;
    this.openRateText = openRateText;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toSenderWindowView(item: SenderWindow): SenderWindowView {
  return new SenderWindowView(
    text.truncate(item.code, 64),
    item.title,
    item.category,
    item.conversionRate.toFixed(2),
    item.minimum.toFixed(2),
    item.cost.toFixed(2),
    String(item.durationMinutes),
    item.journeyId,
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderWindowViews(items: SenderWindow[]): SenderWindowView[] {
  const views: SenderWindowView[] = [];
  for (const item of items) {
    views.push(toSenderWindowView(item));
  }
  return views;
}

export function sumSenderWindowView(view: SenderWindowView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedConversionRate + parsedMinimum + parsedCost;
}
