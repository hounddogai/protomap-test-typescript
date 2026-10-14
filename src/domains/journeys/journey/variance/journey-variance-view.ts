import * as text from "../../../../kit/text.js";
import { JourneyVariance } from "./journey-variance.js";

/** How screens and exports show a journey variance. */
export class JourneyVarianceView {
  code: string;
  label: string;
  locale: string;
  quantity: string;
  weight: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    quantity: string,
    weight: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.quantity = quantity;
    this.weight = weight;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toJourneyVarianceView(item: JourneyVariance): JourneyVarianceView {
  return new JourneyVarianceView(
    item.code,
    item.label,
    text.truncate(item.locale, 40),
    String(item.quantity),
    item.weight.toFixed(2),
    text.truncate(item.externalRef, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toJourneyVarianceViews(items: JourneyVariance[]): JourneyVarianceView[] {
  const views: JourneyVarianceView[] = [];
  for (const item of items) {
    views.push(toJourneyVarianceView(item));
  }
  return views;
}

export function sumJourneyVarianceView(view: JourneyVarianceView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedQuantity + parsedWeight;
}
