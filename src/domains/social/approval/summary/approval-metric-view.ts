import { ApprovalMetric } from "./approval-metric.js";

/** How screens and exports show a approval metric. */
export class ApprovalMetricView {
  code: string;
  labelText: string;
  cohort: string;
  graceDays: string;
  timezoneText: string;
  campaignRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    cohort: string,
    graceDays: string,
    timezoneText: string,
    campaignRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.cohort = cohort;
    this.graceDays = graceDays;
    this.timezoneText = timezoneText;
    this.campaignRefText = campaignRefText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalMetricView(item: ApprovalMetric): ApprovalMetricView {
  return new ApprovalMetricView(
    item.code,
    item.label,
    item.cohort,
    String(item.graceDays),
    item.timezone,
    item.campaignRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalMetricViews(items: ApprovalMetric[]): ApprovalMetricView[] {
  const views: ApprovalMetricView[] = [];
  for (const item of items) {
    views.push(toApprovalMetricView(item));
  }
  return views;
}

export function sumApprovalMetricView(view: ApprovalMetricView): number {
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedGraceDays;
}
