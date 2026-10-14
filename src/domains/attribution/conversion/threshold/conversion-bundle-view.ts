import * as text from "../../../../kit/text.js";
import { ConversionBundle } from "./conversion-bundle.js";

/** How screens and exports show a conversion bundle. */
export class ConversionBundleView {
  code: string;
  label: string;
  quantity: string;
  rate: string;
  phoneText: string;
  region: string;
  thresholdText: string;
  approved: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    quantity: string,
    rate: string,
    phoneText: string,
    region: string,
    thresholdText: string,
    approved: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.rate = rate;
    this.phoneText = phoneText;
    this.region = region;
    this.thresholdText = thresholdText;
    this.approved = approved;
    this.statusLabel = statusLabel;
  }
}

export function toConversionBundleView(item: ConversionBundle): ConversionBundleView {
  return new ConversionBundleView(
    text.truncate(item.code, 40),
    item.label,
    String(item.quantity),
    item.rate.toFixed(2),
    item.phone,
    item.region,
    item.threshold.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toConversionBundleViews(items: ConversionBundle[]): ConversionBundleView[] {
  const views: ConversionBundleView[] = [];
  for (const item of items) {
    views.push(toConversionBundleView(item));
  }
  return views;
}

export function sumConversionBundleView(view: ConversionBundleView): number {
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  return parsedQuantity + parsedRate + parsedThreshold;
}
