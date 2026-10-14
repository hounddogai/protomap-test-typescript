import * as text from "../../../../kit/text.js";
import { RegionalPaywallWindow } from "./regional-paywall-window.js";

/** How screens and exports show a regional paywall window. */
export class RegionalPaywallWindowView {
  code: string;
  title: string;
  archived: string;
  conversionRateText: string;
  quantity: string;
  region: string;
  expiresAt: string;
  startsAt: string;
  source: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    conversionRateText: string,
    quantity: string,
    region: string,
    expiresAt: string,
    startsAt: string,
    source: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.conversionRateText = conversionRateText;
    this.quantity = quantity;
    this.region = region;
    this.expiresAt = expiresAt;
    this.startsAt = startsAt;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toRegionalPaywallWindowView(item: RegionalPaywallWindow): RegionalPaywallWindowView {
  return new RegionalPaywallWindowView(
    item.code,
    item.title,
    `${item.archived}`,
    item.conversionRate.toFixed(2),
    String(item.quantity),
    item.region,
    String(item.expiresAt),
    String(item.startsAt),
    text.truncate(item.source, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toRegionalPaywallWindowViews(items: RegionalPaywallWindow[]): RegionalPaywallWindowView[] {
  const views: RegionalPaywallWindowView[] = [];
  for (const item of items) {
    views.push(toRegionalPaywallWindowView(item));
  }
  return views;
}

export function sumRegionalPaywallWindowView(view: RegionalPaywallWindowView): number {
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedConversionRate + parsedQuantity + parsedExpiresAt;
}
