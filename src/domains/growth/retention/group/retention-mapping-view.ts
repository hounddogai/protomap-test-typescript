import * as text from "../../../../kit/text.js";
import { RetentionMapping } from "./retention-mapping.js";

/** How screens and exports show a retention mapping. */
export class RetentionMappingView {
  code: string;
  titleText: string;
  pinned: string;
  variant: string;
  windowDays: string;
  locale: string;
  impressions: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    pinned: string,
    variant: string,
    windowDays: string,
    locale: string,
    impressions: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.pinned = pinned;
    this.variant = variant;
    this.windowDays = windowDays;
    this.locale = locale;
    this.impressions = impressions;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionMappingView(item: RetentionMapping): RetentionMappingView {
  return new RetentionMappingView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 40),
    `${item.pinned}`,
    item.variant,
    String(item.windowDays),
    item.locale,
    String(item.impressions),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionMappingViews(items: RetentionMapping[]): RetentionMappingView[] {
  const views: RetentionMappingView[] = [];
  for (const item of items) {
    views.push(toRetentionMappingView(item));
  }
  return views;
}

export function sumRetentionMappingView(view: RetentionMappingView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedWindowDays + parsedImpressions + parsedCost;
}
