import * as text from "../../../../kit/text.js";
import { RegionalOptOutBundle } from "./regional-opt-out-bundle.js";

/** How screens and exports show a regional opt out bundle. */
export class RegionalOptOutBundleView {
  codeText: string;
  name: string;
  localeText: string;
  minimum: string;
  threshold: string;
  floorValue: string;
  graceDaysText: string;
  unit: string;
  impressions: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    localeText: string,
    minimum: string,
    threshold: string,
    floorValue: string,
    graceDaysText: string,
    unit: string,
    impressions: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.localeText = localeText;
    this.minimum = minimum;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.graceDaysText = graceDaysText;
    this.unit = unit;
    this.impressions = impressions;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalOptOutBundleView(item: RegionalOptOutBundle): RegionalOptOutBundleView {
  return new RegionalOptOutBundleView(
    text.truncate(item.code, 80),
    item.name,
    item.locale,
    item.minimum.toFixed(2),
    item.threshold.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.graceDays),
    item.unit,
    String(item.impressions),
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalOptOutBundleViews(items: RegionalOptOutBundle[]): RegionalOptOutBundleView[] {
  const views: RegionalOptOutBundleView[] = [];
  for (const item of items) {
    views.push(toRegionalOptOutBundleView(item));
  }
  return views;
}

export function sumRegionalOptOutBundleView(view: RegionalOptOutBundleView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedMinimum + parsedThreshold + parsedFloorValue;
}
