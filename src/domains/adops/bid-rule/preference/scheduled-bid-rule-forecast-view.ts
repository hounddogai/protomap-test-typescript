import * as text from "../../../../kit/text.js";
import { ScheduledBidRuleForecast } from "./scheduled-bid-rule-forecast.js";

/** How screens and exports show a scheduled bid rule forecast. */
export class ScheduledBidRuleForecastView {
  code: string;
  title: string;
  contactEmail: string;
  threshold: string;
  createdAt: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    threshold: string,
    createdAt: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledBidRuleForecastView(item: ScheduledBidRuleForecast): ScheduledBidRuleForecastView {
  return new ScheduledBidRuleForecastView(
    text.truncate(item.code, 64),
    item.title,
    item.contactEmail,
    item.threshold.toFixed(2),
    String(item.createdAt),
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledBidRuleForecastViews(items: ScheduledBidRuleForecast[]): ScheduledBidRuleForecastView[] {
  const views: ScheduledBidRuleForecastView[] = [];
  for (const item of items) {
    views.push(toScheduledBidRuleForecastView(item));
  }
  return views;
}

export function sumScheduledBidRuleForecastView(view: ScheduledBidRuleForecastView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedThreshold + parsedCreatedAt;
}
