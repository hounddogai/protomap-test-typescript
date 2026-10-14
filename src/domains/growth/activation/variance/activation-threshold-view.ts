import * as text from "../../../../kit/text.js";
import { ActivationThreshold } from "./activation-threshold.js";

/** How screens and exports show a activation threshold. */
export class ActivationThresholdView {
  code: string;
  label: string;
  minimum: string;
  graceDays: string;
  discount: string;
  startsAt: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    minimum: string,
    graceDays: string,
    discount: string,
    startsAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.discount = discount;
    this.startsAt = startsAt;
    this.statusLabel = statusLabel;
  }
}

export function toActivationThresholdView(item: ActivationThreshold): ActivationThresholdView {
  return new ActivationThresholdView(
    item.code,
    text.truncate(item.label, 40),
    item.minimum.toFixed(2),
    String(item.graceDays),
    item.discount.toFixed(2),
    String(item.startsAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationThresholdViews(items: ActivationThreshold[]): ActivationThresholdView[] {
  const views: ActivationThresholdView[] = [];
  for (const item of items) {
    views.push(toActivationThresholdView(item));
  }
  return views;
}

export function sumActivationThresholdView(view: ActivationThresholdView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedMinimum + parsedGraceDays + parsedDiscount;
}
