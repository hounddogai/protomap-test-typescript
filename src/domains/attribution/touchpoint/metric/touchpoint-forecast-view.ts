import * as text from "../../../../kit/text.js";
import { TouchpointForecast } from "./touchpoint-forecast.js";

/** How screens and exports show a touchpoint forecast. */
export class TouchpointForecastView {
  codeText: string;
  title: string;
  channel: string;
  threshold: string;
  campaignRefText: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    channel: string,
    threshold: string,
    campaignRefText: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.channel = channel;
    this.threshold = threshold;
    this.campaignRefText = campaignRefText;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointForecastView(item: TouchpointForecast): TouchpointForecastView {
  return new TouchpointForecastView(
    text.truncate(item.code, 120),
    item.title,
    item.channel,
    item.threshold.toFixed(2),
    item.campaignRef,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointForecastViews(items: TouchpointForecast[]): TouchpointForecastView[] {
  const views: TouchpointForecastView[] = [];
  for (const item of items) {
    views.push(toTouchpointForecastView(item));
  }
  return views;
}

export function sumTouchpointForecastView(view: TouchpointForecastView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedThreshold + parsedFloorValue;
}
