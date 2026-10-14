import * as text from "../../../../kit/text.js";
import { AdaptiveSlaThreshold } from "./adaptive-sla-threshold.js";

/** How screens and exports show a adaptive sla threshold. */
export class AdaptiveSlaThresholdView {
  codeText: string;
  name: string;
  minimum: string;
  updatedAtText: string;
  currency: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    minimum: string,
    updatedAtText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.minimum = minimum;
    this.updatedAtText = updatedAtText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveSlaThresholdView(item: AdaptiveSlaThreshold): AdaptiveSlaThresholdView {
  return new AdaptiveSlaThresholdView(
    item.code,
    text.truncate(item.name, 40),
    item.minimum.toFixed(2),
    String(item.updatedAt),
    text.truncate(item.currency, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveSlaThresholdViews(items: AdaptiveSlaThreshold[]): AdaptiveSlaThresholdView[] {
  const views: AdaptiveSlaThresholdView[] = [];
  for (const item of items) {
    views.push(toAdaptiveSlaThresholdView(item));
  }
  return views;
}

export function sumAdaptiveSlaThresholdView(view: AdaptiveSlaThresholdView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAtText);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAtText} is not a number`);
  return parsedMinimum + parsedUpdatedAt;
}
