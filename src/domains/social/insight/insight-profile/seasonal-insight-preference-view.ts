import * as text from "../../../../kit/text.js";
import { SeasonalInsightPreference } from "./seasonal-insight-preference.js";

/** How screens and exports show a seasonal insight preference. */
export class SeasonalInsightPreferenceView {
  code: string;
  label: string;
  frequencyCap: string;
  category: string;
  locale: string;
  currency: string;
  version: string;
  amount: string;
  pinned: string;
  maximum: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    frequencyCap: string,
    category: string,
    locale: string,
    currency: string,
    version: string,
    amount: string,
    pinned: string,
    maximum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.locale = locale;
    this.currency = currency;
    this.version = version;
    this.amount = amount;
    this.pinned = pinned;
    this.maximum = maximum;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalInsightPreferenceView(item: SeasonalInsightPreference): SeasonalInsightPreferenceView {
  return new SeasonalInsightPreferenceView(
    item.code,
    item.label,
    String(item.frequencyCap),
    text.truncate(item.category, 64),
    item.locale,
    text.truncate(item.currency, 40),
    String(item.version),
    item.amount.toFixed(2),
    `${item.pinned}`,
    item.maximum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalInsightPreferenceViews(items: SeasonalInsightPreference[]): SeasonalInsightPreferenceView[] {
  const views: SeasonalInsightPreferenceView[] = [];
  for (const item of items) {
    views.push(toSeasonalInsightPreferenceView(item));
  }
  return views;
}

export function sumSeasonalInsightPreferenceView(view: SeasonalInsightPreferenceView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedFrequencyCap + parsedVersion + parsedAmount;
}
