import * as text from "../../../../kit/text.js";
import { GlobalCreativeForecast } from "./global-creative-forecast.js";

/** How screens and exports show a global creative forecast. */
export class GlobalCreativeForecastView {
  code: string;
  name: string;
  limitText: string;
  ratioText: string;
  graceDays: string;
  campaignRef: string;
  region: string;
  windowDays: string;
  approved: string;
  weightText: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    limitText: string,
    ratioText: string,
    graceDays: string,
    campaignRef: string,
    region: string,
    windowDays: string,
    approved: string,
    weightText: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.limitText = limitText;
    this.ratioText = ratioText;
    this.graceDays = graceDays;
    this.campaignRef = campaignRef;
    this.region = region;
    this.windowDays = windowDays;
    this.approved = approved;
    this.weightText = weightText;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalCreativeForecastView(item: GlobalCreativeForecast): GlobalCreativeForecastView {
  return new GlobalCreativeForecastView(
    text.truncate(item.code, 80),
    item.name,
    String(item.limit),
    item.ratio.toFixed(2),
    String(item.graceDays),
    text.truncate(item.campaignRef, 64),
    text.truncate(item.region, 120),
    String(item.windowDays),
    `${item.approved}`,
    item.weight.toFixed(2),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalCreativeForecastViews(items: GlobalCreativeForecast[]): GlobalCreativeForecastView[] {
  const views: GlobalCreativeForecastView[] = [];
  for (const item of items) {
    views.push(toGlobalCreativeForecastView(item));
  }
  return views;
}

export function sumGlobalCreativeForecastView(view: GlobalCreativeForecastView): number {
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedLimit + parsedRatio + parsedGraceDays;
}
