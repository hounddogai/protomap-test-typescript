import * as text from "../../../../kit/text.js";
import { InsightThreshold } from "./insight-threshold.js";

/** How screens and exports show a insight threshold. */
export class InsightThresholdView {
  code: string;
  name: string;
  cohort: string;
  createdAt: string;
  approved: string;
  utmSource: string;
  windowDays: string;
  journeyId: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    cohort: string,
    createdAt: string,
    approved: string,
    utmSource: string,
    windowDays: string,
    journeyId: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.createdAt = createdAt;
    this.approved = approved;
    this.utmSource = utmSource;
    this.windowDays = windowDays;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toInsightThresholdView(item: InsightThreshold): InsightThresholdView {
  return new InsightThresholdView(
    item.code,
    text.truncate(item.name, 80),
    item.cohort,
    String(item.createdAt),
    `${item.approved}`,
    text.truncate(item.utmSource, 120),
    String(item.windowDays),
    text.truncate(item.journeyId, 64),
    text.truncate(item.timezone, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toInsightThresholdViews(items: InsightThreshold[]): InsightThresholdView[] {
  const views: InsightThresholdView[] = [];
  for (const item of items) {
    views.push(toInsightThresholdView(item));
  }
  return views;
}

export function sumInsightThresholdView(view: InsightThresholdView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCreatedAt + parsedWindowDays;
}
