import * as text from "../../../../kit/text.js";
import { AdaptiveBadgeException } from "./adaptive-badge-exception.js";

/** How screens and exports show a adaptive badge exception. */
export class AdaptiveBadgeExceptionView {
  code: string;
  label: string;
  floorValue: string;
  name: string;
  openRate: string;
  utmSource: string;
  summary: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    floorValue: string,
    name: string,
    openRate: string,
    utmSource: string,
    summary: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.name = name;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.summary = summary;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toAdaptiveBadgeExceptionView(item: AdaptiveBadgeException): AdaptiveBadgeExceptionView {
  return new AdaptiveBadgeExceptionView(
    item.code,
    item.label,
    item.floorValue.toFixed(2),
    item.name,
    item.openRate.toFixed(2),
    text.truncate(item.utmSource, 40),
    item.summary,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toAdaptiveBadgeExceptionViews(items: AdaptiveBadgeException[]): AdaptiveBadgeExceptionView[] {
  const views: AdaptiveBadgeExceptionView[] = [];
  for (const item of items) {
    views.push(toAdaptiveBadgeExceptionView(item));
  }
  return views;
}

export function sumAdaptiveBadgeExceptionView(view: AdaptiveBadgeExceptionView): number {
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  return parsedFloorValue + parsedOpenRate;
}
