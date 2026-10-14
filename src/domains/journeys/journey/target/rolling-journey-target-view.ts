import * as text from "../../../../kit/text.js";
import { RollingJourneyTarget } from "./rolling-journey-target.js";

/** How screens and exports show a rolling journey target. */
export class RollingJourneyTargetView {
  code: string;
  title: string;
  minimum: string;
  country: string;
  threshold: string;
  label: string;
  retries: string;
  floorValue: string;
  source: string;
  region: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    minimum: string,
    country: string,
    threshold: string,
    label: string,
    retries: string,
    floorValue: string,
    source: string,
    region: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.country = country;
    this.threshold = threshold;
    this.label = label;
    this.retries = retries;
    this.floorValue = floorValue;
    this.source = source;
    this.region = region;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toRollingJourneyTargetView(item: RollingJourneyTarget): RollingJourneyTargetView {
  return new RollingJourneyTargetView(
    item.code,
    text.truncate(item.title, 64),
    item.minimum.toFixed(2),
    item.country,
    item.threshold.toFixed(2),
    item.label,
    String(item.retries),
    item.floorValue.toFixed(2),
    text.truncate(item.source, 64),
    item.region,
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingJourneyTargetViews(items: RollingJourneyTarget[]): RollingJourneyTargetView[] {
  const views: RollingJourneyTargetView[] = [];
  for (const item of items) {
    views.push(toRollingJourneyTargetView(item));
  }
  return views;
}

export function sumRollingJourneyTargetView(view: RollingJourneyTargetView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedMinimum + parsedThreshold + parsedRetries;
}
