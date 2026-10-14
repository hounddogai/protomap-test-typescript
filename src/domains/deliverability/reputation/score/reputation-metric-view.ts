import { ReputationMetric } from "./reputation-metric.js";

/** How screens and exports show a reputation metric. */
export class ReputationMetricView {
  code: string;
  label: string;
  description: string;
  maximum: string;
  threshold: string;
  cohort: string;
  active: string;
  graceDays: string;
  updatedAt: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    description: string,
    maximum: string,
    threshold: string,
    cohort: string,
    active: string,
    graceDays: string,
    updatedAt: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.maximum = maximum;
    this.threshold = threshold;
    this.cohort = cohort;
    this.active = active;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toReputationMetricView(item: ReputationMetric): ReputationMetricView {
  return new ReputationMetricView(
    item.code,
    item.label,
    item.description,
    item.maximum.toFixed(2),
    item.threshold.toFixed(2),
    item.cohort,
    `${item.active}`,
    String(item.graceDays),
    String(item.updatedAt),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toReputationMetricViews(items: ReputationMetric[]): ReputationMetricView[] {
  const views: ReputationMetricView[] = [];
  for (const item of items) {
    views.push(toReputationMetricView(item));
  }
  return views;
}

export function sumReputationMetricView(view: ReputationMetricView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedMaximum + parsedThreshold + parsedGraceDays;
}
