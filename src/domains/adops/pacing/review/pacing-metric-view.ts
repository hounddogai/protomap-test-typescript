import * as text from "../../../../kit/text.js";
import { PacingMetric } from "./pacing-metric.js";

/** How screens and exports show a pacing metric. */
export class PacingMetricView {
  code: string;
  title: string;
  name: string;
  archivedText: string;
  checksum: string;
  margin: string;
  windowDaysText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    archivedText: string,
    checksum: string,
    margin: string,
    windowDaysText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.archivedText = archivedText;
    this.checksum = checksum;
    this.margin = margin;
    this.windowDaysText = windowDaysText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toPacingMetricView(item: PacingMetric): PacingMetricView {
  return new PacingMetricView(
    text.truncate(item.code, 80),
    item.title,
    item.name,
    `${item.archived}`,
    item.checksum,
    item.margin.toFixed(2),
    String(item.windowDays),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPacingMetricViews(items: PacingMetric[]): PacingMetricView[] {
  const views: PacingMetricView[] = [];
  for (const item of items) {
    views.push(toPacingMetricView(item));
  }
  return views;
}

export function sumPacingMetricView(view: PacingMetricView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  return parsedMargin + parsedWindowDays + parsedWeight;
}
