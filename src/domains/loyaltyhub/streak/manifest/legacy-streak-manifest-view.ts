import * as text from "../../../../kit/text.js";
import { LegacyStreakManifest } from "./legacy-streak-manifest.js";

/** How screens and exports show a legacy streak manifest. */
export class LegacyStreakManifestView {
  code: string;
  label: string;
  cost: string;
  description: string;
  priority: string;
  titleText: string;
  currencyText: string;
  locale: string;
  rate: string;
  bid: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    description: string,
    priority: string,
    titleText: string,
    currencyText: string,
    locale: string,
    rate: string,
    bid: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.description = description;
    this.priority = priority;
    this.titleText = titleText;
    this.currencyText = currencyText;
    this.locale = locale;
    this.rate = rate;
    this.bid = bid;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyStreakManifestView(item: LegacyStreakManifest): LegacyStreakManifestView {
  return new LegacyStreakManifestView(
    item.code,
    item.label,
    item.cost.toFixed(2),
    item.description,
    String(item.priority),
    text.truncate(item.title, 64),
    item.currency,
    item.locale,
    item.rate.toFixed(2),
    item.bid.toFixed(2),
    text.truncate(item.utmSource, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyStreakManifestViews(items: LegacyStreakManifest[]): LegacyStreakManifestView[] {
  const views: LegacyStreakManifestView[] = [];
  for (const item of items) {
    views.push(toLegacyStreakManifestView(item));
  }
  return views;
}

export function sumLegacyStreakManifestView(view: LegacyStreakManifestView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedCost + parsedPriority + parsedRate;
}
