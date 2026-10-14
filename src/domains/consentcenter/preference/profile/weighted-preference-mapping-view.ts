import * as text from "../../../../kit/text.js";
import { WeightedPreferenceMapping } from "./weighted-preference-mapping.js";

/** How screens and exports show a weighted preference mapping. */
export class WeightedPreferenceMappingView {
  codeText: string;
  nameText: string;
  version: string;
  costText: string;
  pinned: string;
  clicks: string;
  locale: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    version: string,
    costText: string,
    pinned: string,
    clicks: string,
    locale: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.version = version;
    this.costText = costText;
    this.pinned = pinned;
    this.clicks = clicks;
    this.locale = locale;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedPreferenceMappingView(item: WeightedPreferenceMapping): WeightedPreferenceMappingView {
  return new WeightedPreferenceMappingView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 120),
    String(item.version),
    item.cost.toFixed(2),
    `${item.pinned}`,
    String(item.clicks),
    item.locale,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedPreferenceMappingViews(items: WeightedPreferenceMapping[]): WeightedPreferenceMappingView[] {
  const views: WeightedPreferenceMappingView[] = [];
  for (const item of items) {
    views.push(toWeightedPreferenceMappingView(item));
  }
  return views;
}

export function sumWeightedPreferenceMappingView(view: WeightedPreferenceMappingView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedVersion + parsedCost + parsedClicks;
}
