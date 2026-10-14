import * as text from "../../../../kit/text.js";
import { WeightedBouncePreference } from "./weighted-bounce-preference.js";

/** How screens and exports show a weighted bounce preference. */
export class WeightedBouncePreferenceView {
  codeText: string;
  name: string;
  category: string;
  locale: string;
  discount: string;
  channel: string;
  retriesText: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    category: string,
    locale: string,
    discount: string,
    channel: string,
    retriesText: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.category = category;
    this.locale = locale;
    this.discount = discount;
    this.channel = channel;
    this.retriesText = retriesText;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedBouncePreferenceView(item: WeightedBouncePreference): WeightedBouncePreferenceView {
  return new WeightedBouncePreferenceView(
    text.truncate(item.code, 80),
    item.name,
    item.category,
    item.locale,
    item.discount.toFixed(2),
    item.channel,
    String(item.retries),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedBouncePreferenceViews(items: WeightedBouncePreference[]): WeightedBouncePreferenceView[] {
  const views: WeightedBouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toWeightedBouncePreferenceView(item));
  }
  return views;
}

export function sumWeightedBouncePreferenceView(view: WeightedBouncePreferenceView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedDiscount + parsedRetries + parsedRatio;
}
