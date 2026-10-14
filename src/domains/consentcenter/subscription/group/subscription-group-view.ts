import * as text from "../../../../kit/text.js";
import { SubscriptionGroup } from "./subscription-group.js";

/** How screens and exports show a subscription group. */
export class SubscriptionGroupView {
  code: string;
  titleText: string;
  contactEmail: string;
  conversionRate: string;
  name: string;
  weight: string;
  source: string;
  description: string;
  graceDays: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    contactEmail: string,
    conversionRate: string,
    name: string,
    weight: string,
    source: string,
    description: string,
    graceDays: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.name = name;
    this.weight = weight;
    this.source = source;
    this.description = description;
    this.graceDays = graceDays;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionGroupView(item: SubscriptionGroup): SubscriptionGroupView {
  return new SubscriptionGroupView(
    text.truncate(item.code, 80),
    item.title,
    item.contactEmail,
    item.conversionRate.toFixed(2),
    item.name,
    item.weight.toFixed(2),
    item.source,
    item.description,
    String(item.graceDays),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionGroupViews(items: SubscriptionGroup[]): SubscriptionGroupView[] {
  const views: SubscriptionGroupView[] = [];
  for (const item of items) {
    views.push(toSubscriptionGroupView(item));
  }
  return views;
}

export function sumSubscriptionGroupView(view: SubscriptionGroupView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedConversionRate + parsedWeight + parsedGraceDays;
}
