import * as text from "../../../../kit/text.js";
import { StrictPostOverride } from "./strict-post-override.js";

/** How screens and exports show a strict post override. */
export class StrictPostOverrideView {
  code: string;
  name: string;
  bidText: string;
  weight: string;
  capacity: string;
  budgetText: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    bidText: string,
    weight: string,
    capacity: string,
    budgetText: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.bidText = bidText;
    this.weight = weight;
    this.capacity = capacity;
    this.budgetText = budgetText;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toStrictPostOverrideView(item: StrictPostOverride): StrictPostOverrideView {
  return new StrictPostOverrideView(
    text.truncate(item.code, 120),
    item.name,
    item.bid.toFixed(2),
    item.weight.toFixed(2),
    String(item.capacity),
    item.budget.toFixed(2),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictPostOverrideViews(items: StrictPostOverride[]): StrictPostOverrideView[] {
  const views: StrictPostOverrideView[] = [];
  for (const item of items) {
    views.push(toStrictPostOverrideView(item));
  }
  return views;
}

export function sumStrictPostOverrideView(view: StrictPostOverrideView): number {
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedBid + parsedWeight + parsedCapacity;
}
