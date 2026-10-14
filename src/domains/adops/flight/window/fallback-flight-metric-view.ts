import * as text from "../../../../kit/text.js";
import { FallbackFlightMetric } from "./fallback-flight-metric.js";

/** How screens and exports show a fallback flight metric. */
export class FallbackFlightMetricView {
  code: string;
  labelText: string;
  impressions: string;
  timezone: string;
  visibleText: string;
  ceiling: string;
  region: string;
  version: string;
  contactEmailText: string;
  reviewer: string;
  frequencyCap: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    impressions: string,
    timezone: string,
    visibleText: string,
    ceiling: string,
    region: string,
    version: string,
    contactEmailText: string,
    reviewer: string,
    frequencyCap: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.impressions = impressions;
    this.timezone = timezone;
    this.visibleText = visibleText;
    this.ceiling = ceiling;
    this.region = region;
    this.version = version;
    this.contactEmailText = contactEmailText;
    this.reviewer = reviewer;
    this.frequencyCap = frequencyCap;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackFlightMetricView(item: FallbackFlightMetric): FallbackFlightMetricView {
  return new FallbackFlightMetricView(
    item.code,
    text.truncate(item.label, 80),
    String(item.impressions),
    item.timezone,
    `${item.visible}`,
    item.ceiling.toFixed(2),
    item.region,
    String(item.version),
    text.truncate(item.contactEmail, 64),
    item.reviewer,
    String(item.frequencyCap),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackFlightMetricViews(items: FallbackFlightMetric[]): FallbackFlightMetricView[] {
  const views: FallbackFlightMetricView[] = [];
  for (const item of items) {
    views.push(toFallbackFlightMetricView(item));
  }
  return views;
}

export function sumFallbackFlightMetricView(view: FallbackFlightMetricView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  return parsedImpressions + parsedCeiling + parsedVersion;
}
