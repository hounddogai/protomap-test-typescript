import * as text from "../../../../kit/text.js";
import { SubscriptionBundle } from "./subscription-bundle.js";

/** How screens and exports show a subscription bundle. */
export class SubscriptionBundleView {
  codeText: string;
  label: string;
  minimumText: string;
  country: string;
  name: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    minimumText: string,
    country: string,
    name: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.minimumText = minimumText;
    this.country = country;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionBundleView(item: SubscriptionBundle): SubscriptionBundleView {
  return new SubscriptionBundleView(
    item.code,
    text.truncate(item.label, 120),
    item.minimum.toFixed(2),
    text.truncate(item.country, 40),
    item.name,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionBundleViews(items: SubscriptionBundle[]): SubscriptionBundleView[] {
  const views: SubscriptionBundleView[] = [];
  for (const item of items) {
    views.push(toSubscriptionBundleView(item));
  }
  return views;
}

export function sumSubscriptionBundleView(view: SubscriptionBundleView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  return parsedMinimum;
}
