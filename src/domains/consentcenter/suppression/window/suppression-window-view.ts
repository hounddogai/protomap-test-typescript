import * as text from "../../../../kit/text.js";
import { SuppressionWindow } from "./suppression-window.js";

/** How screens and exports show a suppression window. */
export class SuppressionWindowView {
  codeText: string;
  title: string;
  locale: string;
  segment: string;
  openRateText: string;
  floorValue: string;
  variantText: string;
  weightText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    segment: string,
    openRateText: string,
    floorValue: string,
    variantText: string,
    weightText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.segment = segment;
    this.openRateText = openRateText;
    this.floorValue = floorValue;
    this.variantText = variantText;
    this.weightText = weightText;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionWindowView(item: SuppressionWindow): SuppressionWindowView {
  return new SuppressionWindowView(
    text.truncate(item.code, 80),
    item.title,
    item.locale,
    item.segment,
    item.openRate.toFixed(2),
    item.floorValue.toFixed(2),
    item.variant,
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionWindowViews(items: SuppressionWindow[]): SuppressionWindowView[] {
  const views: SuppressionWindowView[] = [];
  for (const item of items) {
    views.push(toSuppressionWindowView(item));
  }
  return views;
}

export function sumSuppressionWindowView(view: SuppressionWindowView): number {
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedOpenRate + parsedFloorValue + parsedWeight;
}
