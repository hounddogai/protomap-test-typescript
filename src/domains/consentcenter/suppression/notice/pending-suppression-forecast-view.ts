import * as text from "../../../../kit/text.js";
import { PendingSuppressionForecast } from "./pending-suppression-forecast.js";

/** How screens and exports show a pending suppression forecast. */
export class PendingSuppressionForecastView {
  codeText: string;
  titleText: string;
  unit: string;
  label: string;
  ceilingText: string;
  region: string;
  channel: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    unit: string,
    label: string,
    ceilingText: string,
    region: string,
    channel: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.unit = unit;
    this.label = label;
    this.ceilingText = ceilingText;
    this.region = region;
    this.channel = channel;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSuppressionForecastView(item: PendingSuppressionForecast): PendingSuppressionForecastView {
  return new PendingSuppressionForecastView(
    item.code,
    text.truncate(item.title, 40),
    item.unit,
    text.truncate(item.label, 40),
    item.ceiling.toFixed(2),
    item.region,
    item.channel,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSuppressionForecastViews(items: PendingSuppressionForecast[]): PendingSuppressionForecastView[] {
  const views: PendingSuppressionForecastView[] = [];
  for (const item of items) {
    views.push(toPendingSuppressionForecastView(item));
  }
  return views;
}

export function sumPendingSuppressionForecastView(view: PendingSuppressionForecastView): number {
  const parsedCeiling = Number(view.ceilingText);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceilingText} is not a number`);
  return parsedCeiling;
}
