import * as text from "../../../../kit/text.js";
import { CohortMetric } from "./cohort-metric.js";

/** How screens and exports show a cohort metric. */
export class CohortMetricView {
  code: string;
  titleText: string;
  reviewer: string;
  checksum: string;
  clicks: string;
  openRate: string;
  quantity: string;
  activeText: string;
  timezoneText: string;
  segmentText: string;
  attemptsText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    reviewer: string,
    checksum: string,
    clicks: string,
    openRate: string,
    quantity: string,
    activeText: string,
    timezoneText: string,
    segmentText: string,
    attemptsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.reviewer = reviewer;
    this.checksum = checksum;
    this.clicks = clicks;
    this.openRate = openRate;
    this.quantity = quantity;
    this.activeText = activeText;
    this.timezoneText = timezoneText;
    this.segmentText = segmentText;
    this.attemptsText = attemptsText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortMetricView(item: CohortMetric): CohortMetricView {
  return new CohortMetricView(
    item.code,
    text.truncate(item.title, 64),
    text.truncate(item.reviewer, 80),
    item.checksum,
    String(item.clicks),
    item.openRate.toFixed(2),
    String(item.quantity),
    `${item.active}`,
    item.timezone,
    item.segment,
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortMetricViews(items: CohortMetric[]): CohortMetricView[] {
  const views: CohortMetricView[] = [];
  for (const item of items) {
    views.push(toCohortMetricView(item));
  }
  return views;
}

export function sumCohortMetricView(view: CohortMetricView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedClicks + parsedOpenRate + parsedQuantity;
}
