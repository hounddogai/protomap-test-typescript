import { TieredRewardMetric } from "./tiered-reward-metric.js";

/** How screens and exports show a tiered reward metric. */
export class TieredRewardMetricView {
  code: string;
  label: string;
  phone: string;
  thresholdText: string;
  startsAt: string;
  cohort: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    phone: string,
    thresholdText: string,
    startsAt: string,
    cohort: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.thresholdText = thresholdText;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.statusLabel = statusLabel;
  }
}

export function toTieredRewardMetricView(item: TieredRewardMetric): TieredRewardMetricView {
  return new TieredRewardMetricView(
    item.code,
    item.label,
    item.phone,
    item.threshold.toFixed(2),
    String(item.startsAt),
    item.cohort,
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredRewardMetricViews(items: TieredRewardMetric[]): TieredRewardMetricView[] {
  const views: TieredRewardMetricView[] = [];
  for (const item of items) {
    views.push(toTieredRewardMetricView(item));
  }
  return views;
}

export function sumTieredRewardMetricView(view: TieredRewardMetricView): number {
  const parsedThreshold = Number(view.thresholdText);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.thresholdText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedThreshold + parsedStartsAt;
}
