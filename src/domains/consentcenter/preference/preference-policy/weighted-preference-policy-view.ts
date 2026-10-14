import * as text from "../../../../kit/text.js";
import { WeightedPreferencePolicy } from "./weighted-preference-policy.js";

/** How screens and exports show a weighted preference policy. */
export class WeightedPreferencePolicyView {
  code: string;
  name: string;
  windowDaysText: string;
  region: string;
  rate: string;
  locale: string;
  impressions: string;
  retriesText: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    windowDaysText: string,
    region: string,
    rate: string,
    locale: string,
    impressions: string,
    retriesText: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.windowDaysText = windowDaysText;
    this.region = region;
    this.rate = rate;
    this.locale = locale;
    this.impressions = impressions;
    this.retriesText = retriesText;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPreferencePolicyView(item: WeightedPreferencePolicy): WeightedPreferencePolicyView {
  return new WeightedPreferencePolicyView(
    item.code,
    item.name,
    String(item.windowDays),
    text.truncate(item.region, 64),
    item.rate.toFixed(2),
    item.locale,
    String(item.impressions),
    String(item.retries),
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPreferencePolicyViews(items: WeightedPreferencePolicy[]): WeightedPreferencePolicyView[] {
  const views: WeightedPreferencePolicyView[] = [];
  for (const item of items) {
    views.push(toWeightedPreferencePolicyView(item));
  }
  return views;
}

export function sumWeightedPreferencePolicyView(view: WeightedPreferencePolicyView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  return parsedWindowDays + parsedRate + parsedImpressions;
}
