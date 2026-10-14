import * as text from "../../../../kit/text.js";
import { DoubleOptInVariance } from "./double-opt-in-variance.js";

/** How screens and exports show a double opt in variance. */
export class DoubleOptInVarianceView {
  code: string;
  title: string;
  category: string;
  impressionsText: string;
  limit: string;
  weight: string;
  expiresAt: string;
  locale: string;
  timezone: string;
  name: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    category: string,
    impressionsText: string,
    limit: string,
    weight: string,
    expiresAt: string,
    locale: string,
    timezone: string,
    name: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.impressionsText = impressionsText;
    this.limit = limit;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.locale = locale;
    this.timezone = timezone;
    this.name = name;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInVarianceView(item: DoubleOptInVariance): DoubleOptInVarianceView {
  return new DoubleOptInVarianceView(
    item.code,
    item.title,
    text.truncate(item.category, 80),
    String(item.impressions),
    String(item.limit),
    item.weight.toFixed(2),
    String(item.expiresAt),
    item.locale,
    item.timezone,
    text.truncate(item.name, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInVarianceViews(items: DoubleOptInVariance[]): DoubleOptInVarianceView[] {
  const views: DoubleOptInVarianceView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInVarianceView(item));
  }
  return views;
}

export function sumDoubleOptInVarianceView(view: DoubleOptInVarianceView): number {
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedImpressions + parsedLimit + parsedWeight;
}
