import { RegionalQueueMetric } from "./regional-queue-metric.js";

/** How screens and exports show a regional queue metric. */
export class RegionalQueueMetricView {
  code: string;
  title: string;
  attempts: string;
  endsAt: string;
  rate: string;
  statusLabel: string;

  constructor(code: string, title: string, attempts: string, endsAt: string, rate: string, statusLabel: string) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.endsAt = endsAt;
    this.rate = rate;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalQueueMetricView(item: RegionalQueueMetric): RegionalQueueMetricView {
  return new RegionalQueueMetricView(
    item.code,
    item.title,
    String(item.attempts),
    String(item.endsAt),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalQueueMetricViews(items: RegionalQueueMetric[]): RegionalQueueMetricView[] {
  const views: RegionalQueueMetricView[] = [];
  for (const item of items) {
    views.push(toRegionalQueueMetricView(item));
  }
  return views;
}

export function sumRegionalQueueMetricView(view: RegionalQueueMetricView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  const parsedRate = Number(view.rate);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rate} is not a number`);
  return parsedAttempts + parsedEndsAt + parsedRate;
}
