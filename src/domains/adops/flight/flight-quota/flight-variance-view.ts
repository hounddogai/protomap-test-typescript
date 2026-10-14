import * as text from "../../../../kit/text.js";
import { FlightVariance } from "./flight-variance.js";

/** How screens and exports show a flight variance. */
export class FlightVarianceView {
  code: string;
  label: string;
  priorityText: string;
  categoryText: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    priorityText: string,
    categoryText: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.priorityText = priorityText;
    this.categoryText = categoryText;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toFlightVarianceView(item: FlightVariance): FlightVarianceView {
  return new FlightVarianceView(
    item.code,
    text.truncate(item.label, 40),
    String(item.priority),
    item.category,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightVarianceViews(items: FlightVariance[]): FlightVarianceView[] {
  const views: FlightVarianceView[] = [];
  for (const item of items) {
    views.push(toFlightVarianceView(item));
  }
  return views;
}

export function sumFlightVarianceView(view: FlightVarianceView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedPriority + parsedDiscount;
}
