import * as text from "../../../../kit/text.js";
import { ScheduledOptOutAllocation } from "./scheduled-opt-out-allocation.js";

/** How screens and exports show a scheduled opt out allocation. */
export class ScheduledOptOutAllocationView {
  codeText: string;
  titleText: string;
  limit: string;
  weight: string;
  locale: string;
  minimum: string;
  budget: string;
  endsAt: string;
  floorValue: string;
  clicksText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    limit: string,
    weight: string,
    locale: string,
    minimum: string,
    budget: string,
    endsAt: string,
    floorValue: string,
    clicksText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.limit = limit;
    this.weight = weight;
    this.locale = locale;
    this.minimum = minimum;
    this.budget = budget;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.clicksText = clicksText;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledOptOutAllocationView(item: ScheduledOptOutAllocation): ScheduledOptOutAllocationView {
  return new ScheduledOptOutAllocationView(
    item.code,
    text.truncate(item.title, 40),
    String(item.limit),
    item.weight.toFixed(2),
    item.locale,
    item.minimum.toFixed(2),
    item.budget.toFixed(2),
    String(item.endsAt),
    item.floorValue.toFixed(2),
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledOptOutAllocationViews(items: ScheduledOptOutAllocation[]): ScheduledOptOutAllocationView[] {
  const views: ScheduledOptOutAllocationView[] = [];
  for (const item of items) {
    views.push(toScheduledOptOutAllocationView(item));
  }
  return views;
}

export function sumScheduledOptOutAllocationView(view: ScheduledOptOutAllocationView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedLimit + parsedWeight + parsedMinimum;
}
