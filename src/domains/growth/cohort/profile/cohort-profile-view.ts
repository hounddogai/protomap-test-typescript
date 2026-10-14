import * as text from "../../../../kit/text.js";
import { CohortProfile } from "./cohort-profile.js";

/** How screens and exports show a cohort profile. */
export class CohortProfileView {
  code: string;
  title: string;
  costText: string;
  floorValue: string;
  durationMinutes: string;
  checksum: string;
  timezone: string;
  ceilingText: string;
  locale: string;
  archived: string;
  minimum: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    costText: string,
    floorValue: string,
    durationMinutes: string,
    checksum: string,
    timezone: string,
    ceilingText: string,
    locale: string,
    archived: string,
    minimum: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.costText = costText;
    this.floorValue = floorValue;
    this.durationMinutes = durationMinutes;
    this.checksum = checksum;
    this.timezone = timezone;
    this.ceilingText = ceilingText;
    this.locale = locale;
    this.archived = archived;
    this.minimum = minimum;
    this.statusLabel = statusLabel;
  }
}

export function toCohortProfileView(item: CohortProfile): CohortProfileView {
  return new CohortProfileView(
    item.code,
    text.truncate(item.title, 40),
    item.cost.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.durationMinutes),
    item.checksum,
    item.timezone,
    item.ceiling.toFixed(2),
    text.truncate(item.locale, 120),
    `${item.archived}`,
    item.minimum.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortProfileViews(items: CohortProfile[]): CohortProfileView[] {
  const views: CohortProfileView[] = [];
  for (const item of items) {
    views.push(toCohortProfileView(item));
  }
  return views;
}

export function sumCohortProfileView(view: CohortProfileView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedCost + parsedFloorValue + parsedDurationMinutes;
}
