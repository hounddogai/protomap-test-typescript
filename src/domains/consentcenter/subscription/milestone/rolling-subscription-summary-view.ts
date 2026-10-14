import { RollingSubscriptionSummary } from "./rolling-subscription-summary.js";

/** How screens and exports show a rolling subscription summary. */
export class RollingSubscriptionSummaryView {
  code: string;
  name: string;
  maximum: string;
  clicks: string;
  minimum: string;
  cohort: string;
  sendAtText: string;
  limitText: string;
  updatedAtText: string;
  sequence: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    maximum: string,
    clicks: string,
    minimum: string,
    cohort: string,
    sendAtText: string,
    limitText: string,
    updatedAtText: string,
    sequence: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.clicks = clicks;
    this.minimum = minimum;
    this.cohort = cohort;
    this.sendAtText = sendAtText;
    this.limitText = limitText;
    this.updatedAtText = updatedAtText;
    this.sequence = sequence;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toRollingSubscriptionSummaryView(item: RollingSubscriptionSummary): RollingSubscriptionSummaryView {
  return new RollingSubscriptionSummaryView(
    item.code,
    item.name,
    item.maximum.toFixed(2),
    String(item.clicks),
    item.minimum.toFixed(2),
    item.cohort,
    String(item.sendAt),
    String(item.limit),
    String(item.updatedAt),
    String(item.sequence),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingSubscriptionSummaryViews(items: RollingSubscriptionSummary[]): RollingSubscriptionSummaryView[] {
  const views: RollingSubscriptionSummaryView[] = [];
  for (const item of items) {
    views.push(toRollingSubscriptionSummaryView(item));
  }
  return views;
}

export function sumRollingSubscriptionSummaryView(view: RollingSubscriptionSummaryView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedMaximum + parsedClicks + parsedMinimum;
}
