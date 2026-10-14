import * as text from "../../../../kit/text.js";
import { GlobalPathMetric } from "./global-path-metric.js";

/** How screens and exports show a global path metric. */
export class GlobalPathMetricView {
  codeText: string;
  name: string;
  sourceText: string;
  ownerId: string;
  durationMinutes: string;
  cohortText: string;
  locale: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    sourceText: string,
    ownerId: string,
    durationMinutes: string,
    cohortText: string,
    locale: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.sourceText = sourceText;
    this.ownerId = ownerId;
    this.durationMinutes = durationMinutes;
    this.cohortText = cohortText;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalPathMetricView(item: GlobalPathMetric): GlobalPathMetricView {
  return new GlobalPathMetricView(
    item.code,
    item.name,
    text.truncate(item.source, 120),
    item.ownerId,
    String(item.durationMinutes),
    item.cohort,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalPathMetricViews(items: GlobalPathMetric[]): GlobalPathMetricView[] {
  const views: GlobalPathMetricView[] = [];
  for (const item of items) {
    views.push(toGlobalPathMetricView(item));
  }
  return views;
}

export function sumGlobalPathMetricView(view: GlobalPathMetricView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  return parsedDurationMinutes;
}
