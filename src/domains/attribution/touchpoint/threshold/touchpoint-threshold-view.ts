import * as text from "../../../../kit/text.js";
import { TouchpointThreshold } from "./touchpoint-threshold.js";

/** How screens and exports show a touchpoint threshold. */
export class TouchpointThresholdView {
  code: string;
  label: string;
  retries: string;
  channel: string;
  approvedText: string;
  localeText: string;
  title: string;
  region: string;
  amount: string;
  source: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    retries: string,
    channel: string,
    approvedText: string,
    localeText: string,
    title: string,
    region: string,
    amount: string,
    source: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.retries = retries;
    this.channel = channel;
    this.approvedText = approvedText;
    this.localeText = localeText;
    this.title = title;
    this.region = region;
    this.amount = amount;
    this.source = source;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointThresholdView(item: TouchpointThreshold): TouchpointThresholdView {
  return new TouchpointThresholdView(
    item.code,
    item.label,
    String(item.retries),
    item.channel,
    `${item.approved}`,
    item.locale,
    text.truncate(item.title, 40),
    item.region,
    item.amount.toFixed(2),
    item.source,
    item.timezone,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointThresholdViews(items: TouchpointThreshold[]): TouchpointThresholdView[] {
  const views: TouchpointThresholdView[] = [];
  for (const item of items) {
    views.push(toTouchpointThresholdView(item));
  }
  return views;
}

export function sumTouchpointThresholdView(view: TouchpointThresholdView): number {
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedRetries + parsedAmount;
}
