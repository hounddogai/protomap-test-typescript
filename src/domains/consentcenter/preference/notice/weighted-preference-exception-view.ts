import * as text from "../../../../kit/text.js";
import { WeightedPreferenceException } from "./weighted-preference-exception.js";

/** How screens and exports show a weighted preference exception. */
export class WeightedPreferenceExceptionView {
  code: string;
  label: string;
  retries: string;
  locale: string;
  externalRef: string;
  conversionRate: string;
  pinnedText: string;
  capacity: string;
  budget: string;
  expiresAt: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    locale: string,
    externalRef: string,
    conversionRate: string,
    pinnedText: string,
    capacity: string,
    budget: string,
    expiresAt: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.locale = locale;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.pinnedText = pinnedText;
    this.capacity = capacity;
    this.budget = budget;
    this.expiresAt = expiresAt;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPreferenceExceptionView(item: WeightedPreferenceException): WeightedPreferenceExceptionView {
  return new WeightedPreferenceExceptionView(
    text.truncate(item.code, 120),
    item.label,
    String(item.retries),
    item.locale,
    item.externalRef,
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    String(item.capacity),
    item.budget.toFixed(2),
    String(item.expiresAt),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPreferenceExceptionViews(items: WeightedPreferenceException[]): WeightedPreferenceExceptionView[] {
  const views: WeightedPreferenceExceptionView[] = [];
  for (const item of items) {
    views.push(toWeightedPreferenceExceptionView(item));
  }
  return views;
}

export function sumWeightedPreferenceExceptionView(view: WeightedPreferenceExceptionView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedRetries + parsedConversionRate + parsedCapacity;
}
