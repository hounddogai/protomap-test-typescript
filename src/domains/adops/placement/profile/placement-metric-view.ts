import * as text from "../../../../kit/text.js";
import { PlacementMetric } from "./placement-metric.js";

/** How screens and exports show a placement metric. */
export class PlacementMetricView {
  code: string;
  nameText: string;
  amount: string;
  journeyId: string;
  unit: string;
  variantText: string;
  graceDays: string;
  active: string;
  country: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    amount: string,
    journeyId: string,
    unit: string,
    variantText: string,
    graceDays: string,
    active: string,
    country: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.amount = amount;
    this.journeyId = journeyId;
    this.unit = unit;
    this.variantText = variantText;
    this.graceDays = graceDays;
    this.active = active;
    this.country = country;
    this.statusLabel = statusLabel;
  }
}

export function toPlacementMetricView(item: PlacementMetric): PlacementMetricView {
  return new PlacementMetricView(
    item.code,
    text.truncate(item.name, 64),
    item.amount.toFixed(2),
    item.journeyId,
    text.truncate(item.unit, 64),
    item.variant,
    String(item.graceDays),
    `${item.active}`,
    text.truncate(item.country, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toPlacementMetricViews(items: PlacementMetric[]): PlacementMetricView[] {
  const views: PlacementMetricView[] = [];
  for (const item of items) {
    views.push(toPlacementMetricView(item));
  }
  return views;
}

export function sumPlacementMetricView(view: PlacementMetricView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedAmount + parsedGraceDays;
}
