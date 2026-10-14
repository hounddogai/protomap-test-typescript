import * as text from "../../../../kit/text.js";
import { AdaptiveFlightMapping } from "./adaptive-flight-mapping.js";

/** How screens and exports show a adaptive flight mapping. */
export class AdaptiveFlightMappingView {
  code: string;
  name: string;
  openRate: string;
  capacity: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    openRate: string,
    capacity: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.capacity = capacity;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveFlightMappingView(item: AdaptiveFlightMapping): AdaptiveFlightMappingView {
  return new AdaptiveFlightMappingView(
    item.code,
    text.truncate(item.name, 120),
    item.openRate.toFixed(2),
    String(item.capacity),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveFlightMappingViews(items: AdaptiveFlightMapping[]): AdaptiveFlightMappingView[] {
  const views: AdaptiveFlightMappingView[] = [];
  for (const item of items) {
    views.push(toAdaptiveFlightMappingView(item));
  }
  return views;
}

export function sumAdaptiveFlightMappingView(view: AdaptiveFlightMappingView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedOpenRate + parsedCapacity + parsedWindowDays;
}
