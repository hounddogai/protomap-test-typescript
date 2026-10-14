import * as text from "../../../../kit/text.js";
import { AdaptiveSuppressionPolicy } from "./adaptive-suppression-policy.js";

/** How screens and exports show a adaptive suppression policy. */
export class AdaptiveSuppressionPolicyView {
  code: string;
  labelText: string;
  minimum: string;
  locale: string;
  ceiling: string;
  quantity: string;
  regionText: string;
  discount: string;
  title: string;
  frequencyCapText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    minimum: string,
    locale: string,
    ceiling: string,
    quantity: string,
    regionText: string,
    discount: string,
    title: string,
    frequencyCapText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.minimum = minimum;
    this.locale = locale;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.regionText = regionText;
    this.discount = discount;
    this.title = title;
    this.frequencyCapText = frequencyCapText;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSuppressionPolicyView(item: AdaptiveSuppressionPolicy): AdaptiveSuppressionPolicyView {
  return new AdaptiveSuppressionPolicyView(
    item.code,
    text.truncate(item.label, 40),
    item.minimum.toFixed(2),
    item.locale,
    item.ceiling.toFixed(2),
    String(item.quantity),
    item.region,
    item.discount.toFixed(2),
    text.truncate(item.title, 120),
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSuppressionPolicyViews(items: AdaptiveSuppressionPolicy[]): AdaptiveSuppressionPolicyView[] {
  const views: AdaptiveSuppressionPolicyView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSuppressionPolicyView(item));
  }
  return views;
}

export function sumAdaptiveSuppressionPolicyView(view: AdaptiveSuppressionPolicyView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMinimum + parsedCeiling + parsedQuantity;
}
