import * as text from "../../../../kit/text.js";
import { DefaultEscalationMetric } from "./default-escalation-metric.js";

/** How screens and exports show a default escalation metric. */
export class DefaultEscalationMetricView {
  code: string;
  titleText: string;
  expiresAtText: string;
  notesText: string;
  phone: string;
  bid: string;
  retries: string;
  localeText: string;
  frequencyCapText: string;
  floorValueText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    expiresAtText: string,
    notesText: string,
    phone: string,
    bid: string,
    retries: string,
    localeText: string,
    frequencyCapText: string,
    floorValueText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.expiresAtText = expiresAtText;
    this.notesText = notesText;
    this.phone = phone;
    this.bid = bid;
    this.retries = retries;
    this.localeText = localeText;
    this.frequencyCapText = frequencyCapText;
    this.floorValueText = floorValueText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultEscalationMetricView(item: DefaultEscalationMetric): DefaultEscalationMetricView {
  return new DefaultEscalationMetricView(
    item.code,
    item.title,
    String(item.expiresAt),
    item.notes,
    text.truncate(item.phone, 40),
    item.bid.toFixed(2),
    String(item.retries),
    text.truncate(item.locale, 80),
    String(item.frequencyCap),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultEscalationMetricViews(items: DefaultEscalationMetric[]): DefaultEscalationMetricView[] {
  const views: DefaultEscalationMetricView[] = [];
  for (const item of items) {
    views.push(toDefaultEscalationMetricView(item));
  }
  return views;
}

export function sumDefaultEscalationMetricView(view: DefaultEscalationMetricView): number {
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedExpiresAt + parsedBid + parsedRetries;
}
