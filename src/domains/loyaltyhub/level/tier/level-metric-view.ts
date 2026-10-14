import * as text from "../../../../kit/text.js";
import { LevelMetric } from "./level-metric.js";

/** How screens and exports show a level metric. */
export class LevelMetricView {
  code: string;
  label: string;
  locale: string;
  startsAt: string;
  openRateText: string;
  variant: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    locale: string,
    startsAt: string,
    openRateText: string,
    variant: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.startsAt = startsAt;
    this.openRateText = openRateText;
    this.variant = variant;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toLevelMetricView(item: LevelMetric): LevelMetricView {
  return new LevelMetricView(
    item.code,
    text.truncate(item.label, 80),
    text.truncate(item.locale, 64),
    String(item.startsAt),
    item.openRate.toFixed(2),
    item.variant,
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toLevelMetricViews(items: LevelMetric[]): LevelMetricView[] {
  const views: LevelMetricView[] = [];
  for (const item of items) {
    views.push(toLevelMetricView(item));
  }
  return views;
}

export function sumLevelMetricView(view: LevelMetricView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedStartsAt + parsedOpenRate + parsedWindowDays;
}
