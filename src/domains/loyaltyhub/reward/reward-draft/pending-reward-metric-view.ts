import * as text from "../../../../kit/text.js";
import { PendingRewardMetric } from "./pending-reward-metric.js";

/** How screens and exports show a pending reward metric. */
export class PendingRewardMetricView {
  codeText: string;
  name: string;
  labelText: string;
  externalRef: string;
  title: string;
  ratio: string;
  timezone: string;
  region: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    labelText: string,
    externalRef: string,
    title: string,
    ratio: string,
    timezone: string,
    region: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.labelText = labelText;
    this.externalRef = externalRef;
    this.title = title;
    this.ratio = ratio;
    this.timezone = timezone;
    this.region = region;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toPendingRewardMetricView(item: PendingRewardMetric): PendingRewardMetricView {
  return new PendingRewardMetricView(
    item.code,
    text.truncate(item.name, 40),
    item.label,
    text.truncate(item.externalRef, 120),
    item.title,
    item.ratio.toFixed(2),
    item.timezone,
    item.region,
    item.checksum,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingRewardMetricViews(items: PendingRewardMetric[]): PendingRewardMetricView[] {
  const views: PendingRewardMetricView[] = [];
  for (const item of items) {
    views.push(toPendingRewardMetricView(item));
  }
  return views;
}

export function sumPendingRewardMetricView(view: PendingRewardMetricView): number {
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedRatio;
}
