import * as text from "../../../../kit/text.js";
import { TieredPaywallPreference } from "./tiered-paywall-preference.js";

/** How screens and exports show a tiered paywall preference. */
export class TieredPaywallPreferenceView {
  code: string;
  title: string;
  cohort: string;
  utmSource: string;
  weight: string;
  expiresAt: string;
  sendAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    cohort: string,
    utmSource: string,
    weight: string,
    expiresAt: string,
    sendAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.weight = weight;
    this.expiresAt = expiresAt;
    this.sendAt = sendAt;
    this.statusLabel = statusLabel;
  }
}

export function toTieredPaywallPreferenceView(item: TieredPaywallPreference): TieredPaywallPreferenceView {
  return new TieredPaywallPreferenceView(
    item.code,
    text.truncate(item.title, 120),
    item.cohort,
    item.utmSource,
    item.weight.toFixed(2),
    String(item.expiresAt),
    String(item.sendAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredPaywallPreferenceViews(items: TieredPaywallPreference[]): TieredPaywallPreferenceView[] {
  const views: TieredPaywallPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredPaywallPreferenceView(item));
  }
  return views;
}

export function sumTieredPaywallPreferenceView(view: TieredPaywallPreferenceView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedWeight + parsedExpiresAt + parsedSendAt;
}
