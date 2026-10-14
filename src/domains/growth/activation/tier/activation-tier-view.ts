import * as text from "../../../../kit/text.js";
import { ActivationTier } from "./activation-tier.js";

/** How screens and exports show a activation tier. */
export class ActivationTierView {
  code: string;
  labelText: string;
  retries: string;
  summaryText: string;
  capacityText: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    retries: string,
    summaryText: string,
    capacityText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.retries = retries;
    this.summaryText = summaryText;
    this.capacityText = capacityText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toActivationTierView(item: ActivationTier): ActivationTierView {
  return new ActivationTierView(
    item.code,
    item.label,
    String(item.retries),
    text.truncate(item.summary, 40),
    String(item.capacity),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toActivationTierViews(items: ActivationTier[]): ActivationTierView[] {
  const views: ActivationTierView[] = [];
  for (const item of items) {
    views.push(toActivationTierView(item));
  }
  return views;
}

export function sumActivationTierView(view: ActivationTierView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCapacity = Number(view.capacityText);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacityText} is not a number`);
  return parsedRetries + parsedCapacity;
}
