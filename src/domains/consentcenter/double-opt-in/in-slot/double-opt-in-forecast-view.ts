import * as text from "../../../../kit/text.js";
import { DoubleOptInForecast } from "./double-opt-in-forecast.js";

/** How screens and exports show a double opt in forecast. */
export class DoubleOptInForecastView {
  codeText: string;
  title: string;
  journeyId: string;
  threshold: string;
  ratioText: string;
  clicks: string;
  impressionsText: string;
  updatedAtText: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    journeyId: string,
    threshold: string,
    ratioText: string,
    clicks: string,
    impressionsText: string,
    updatedAtText: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.journeyId = journeyId;
    this.threshold = threshold;
    this.ratioText = ratioText;
    this.clicks = clicks;
    this.impressionsText = impressionsText;
    this.updatedAtText = updatedAtText;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toDoubleOptInForecastView(item: DoubleOptInForecast): DoubleOptInForecastView {
  return new DoubleOptInForecastView(
    text.truncate(item.code, 80),
    item.title,
    item.journeyId,
    item.threshold.toFixed(2),
    item.ratio.toFixed(2),
    String(item.clicks),
    String(item.impressions),
    String(item.updatedAt),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toDoubleOptInForecastViews(items: DoubleOptInForecast[]): DoubleOptInForecastView[] {
  const views: DoubleOptInForecastView[] = [];
  for (const item of items) {
    views.push(toDoubleOptInForecastView(item));
  }
  return views;
}

export function sumDoubleOptInForecastView(view: DoubleOptInForecastView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedRatio = Number(view.ratioText);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratioText} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  return parsedThreshold + parsedRatio + parsedClicks;
}
