import * as text from "../../../../kit/text.js";
import { FlightThreshold } from "./flight-threshold.js";

/** How screens and exports show a flight threshold. */
export class FlightThresholdView {
  code: string;
  name: string;
  ratio: string;
  quantity: string;
  campaignRef: string;
  expiresAt: string;
  sourceText: string;
  conversionRate: string;
  sequence: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ratio: string,
    quantity: string,
    campaignRef: string,
    expiresAt: string,
    sourceText: string,
    conversionRate: string,
    sequence: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.sourceText = sourceText;
    this.conversionRate = conversionRate;
    this.sequence = sequence;
    this.statusLabel = statusLabel;
  }
}

export function toFlightThresholdView(item: FlightThreshold): FlightThresholdView {
  return new FlightThresholdView(
    item.code,
    item.name,
    item.ratio.toFixed(2),
    String(item.quantity),
    item.campaignRef,
    String(item.expiresAt),
    text.truncate(item.source, 80),
    item.conversionRate.toFixed(2),
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toFlightThresholdViews(items: FlightThreshold[]): FlightThresholdView[] {
  const views: FlightThresholdView[] = [];
  for (const item of items) {
    views.push(toFlightThresholdView(item));
  }
  return views;
}

export function sumFlightThresholdView(view: FlightThresholdView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedRatio + parsedQuantity + parsedExpiresAt;
}
