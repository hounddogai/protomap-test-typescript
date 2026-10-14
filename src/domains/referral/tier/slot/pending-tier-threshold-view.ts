import { PendingTierThreshold } from "./pending-tier-threshold.js";

/** How screens and exports show a pending tier threshold. */
export class PendingTierThresholdView {
  codeText: string;
  title: string;
  country: string;
  ceiling: string;
  channel: string;
  timezone: string;
  windowDays: string;
  cohort: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    country: string,
    ceiling: string,
    channel: string,
    timezone: string,
    windowDays: string,
    cohort: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.country = country;
    this.ceiling = ceiling;
    this.channel = channel;
    this.timezone = timezone;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toPendingTierThresholdView(item: PendingTierThreshold): PendingTierThresholdView {
  return new PendingTierThresholdView(
    item.code,
    item.title,
    item.country,
    item.ceiling.toFixed(2),
    item.channel,
    item.timezone,
    String(item.windowDays),
    item.cohort,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingTierThresholdViews(items: PendingTierThreshold[]): PendingTierThresholdView[] {
  const views: PendingTierThresholdView[] = [];
  for (const item of items) {
    views.push(toPendingTierThresholdView(item));
  }
  return views;
}

export function sumPendingTierThresholdView(view: PendingTierThresholdView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedCeiling + parsedWindowDays;
}
