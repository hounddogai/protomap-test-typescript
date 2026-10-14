import * as text from "../../../../kit/text.js";
import { SubscriptionRequest } from "./subscription-request.js";

/** How screens and exports show a subscription request. */
export class SubscriptionRequestView {
  codeText: string;
  title: string;
  label: string;
  locale: string;
  regionText: string;
  floorValueText: string;
  expiresAt: string;
  marginText: string;
  frequencyCap: string;
  weight: string;
  cost: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    label: string,
    locale: string,
    regionText: string,
    floorValueText: string,
    expiresAt: string,
    marginText: string,
    frequencyCap: string,
    weight: string,
    cost: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.label = label;
    this.locale = locale;
    this.regionText = regionText;
    this.floorValueText = floorValueText;
    this.expiresAt = expiresAt;
    this.marginText = marginText;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionRequestView(item: SubscriptionRequest): SubscriptionRequestView {
  return new SubscriptionRequestView(
    item.code,
    text.truncate(item.title, 80),
    item.label,
    text.truncate(item.locale, 64),
    text.truncate(item.region, 80),
    item.floorValue.toFixed(2),
    String(item.expiresAt),
    item.margin.toFixed(2),
    String(item.frequencyCap),
    item.weight.toFixed(2),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionRequestViews(items: SubscriptionRequest[]): SubscriptionRequestView[] {
  const views: SubscriptionRequestView[] = [];
  for (const item of items) {
    views.push(toSubscriptionRequestView(item));
  }
  return views;
}

export function sumSubscriptionRequestView(view: SubscriptionRequestView): number {
  const parsedFloorValue = Number(view.floorValueText);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValueText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedFloorValue + parsedExpiresAt + parsedMargin;
}
