import * as text from "../../../../kit/text.js";
import { RollingFlightMetric } from "./rolling-flight-metric.js";

/** How screens and exports show a rolling flight metric. */
export class RollingFlightMetricView {
  code: string;
  labelText: string;
  maximum: string;
  timezoneText: string;
  marginText: string;
  frequencyCap: string;
  utmSource: string;
  segment: string;
  clicks: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    maximum: string,
    timezoneText: string,
    marginText: string,
    frequencyCap: string,
    utmSource: string,
    segment: string,
    clicks: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.maximum = maximum;
    this.timezoneText = timezoneText;
    this.marginText = marginText;
    this.frequencyCap = frequencyCap;
    this.utmSource = utmSource;
    this.segment = segment;
    this.clicks = clicks;
    this.statusLabel = statusLabel;
  }
}

export function toRollingFlightMetricView(item: RollingFlightMetric): RollingFlightMetricView {
  return new RollingFlightMetricView(
    text.truncate(item.code, 120),
    item.label,
    item.maximum.toFixed(2),
    text.truncate(item.timezone, 120),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    item.utmSource,
    item.segment,
    String(item.clicks),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingFlightMetricViews(items: RollingFlightMetric[]): RollingFlightMetricView[] {
  const views: RollingFlightMetricView[] = [];
  for (const item of items) {
    views.push(toRollingFlightMetricView(item));
  }
  return views;
}

export function sumRollingFlightMetricView(view: RollingFlightMetricView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  return parsedMaximum + parsedMargin + parsedFrequencyCap;
}
