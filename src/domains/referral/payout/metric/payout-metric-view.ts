import * as text from "../../../../kit/text.js";
import { PayoutMetric } from "./payout-metric.js";

/** How screens and exports show a payout metric. */
export class PayoutMetricView {
  code: string;
  name: string;
  channel: string;
  approvedText: string;
  unit: string;
  reviewer: string;
  clicks: string;
  graceDaysText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    channel: string,
    approvedText: string,
    unit: string,
    reviewer: string,
    clicks: string,
    graceDaysText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.approvedText = approvedText;
    this.unit = unit;
    this.reviewer = reviewer;
    this.clicks = clicks;
    this.graceDaysText = graceDaysText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutMetricView(item: PayoutMetric): PayoutMetricView {
  return new PayoutMetricView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.channel, 80),
    `${item.approved}`,
    item.unit,
    item.reviewer,
    String(item.clicks),
    String(item.graceDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutMetricViews(items: PayoutMetric[]): PayoutMetricView[] {
  const views: PayoutMetricView[] = [];
  for (const item of items) {
    views.push(toPayoutMetricView(item));
  }
  return views;
}

export function sumPayoutMetricView(view: PayoutMetricView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  return parsedClicks + parsedGraceDays;
}
