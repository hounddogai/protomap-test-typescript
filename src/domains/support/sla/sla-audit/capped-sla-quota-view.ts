import * as text from "../../../../kit/text.js";
import { CappedSlaQuota } from "./capped-sla-quota.js";

/** How screens and exports show a capped sla quota. */
export class CappedSlaQuotaView {
  code: string;
  titleText: string;
  locale: string;
  clicksText: string;
  externalRef: string;
  timezone: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    locale: string,
    clicksText: string,
    externalRef: string,
    timezone: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.locale = locale;
    this.clicksText = clicksText;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.statusLabel = statusLabel;
  }
}

export function toCappedSlaQuotaView(item: CappedSlaQuota): CappedSlaQuotaView {
  return new CappedSlaQuotaView(
    item.code,
    item.title,
    text.truncate(item.locale, 40),
    String(item.clicks),
    text.truncate(item.externalRef, 40),
    text.truncate(item.timezone, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedSlaQuotaViews(items: CappedSlaQuota[]): CappedSlaQuotaView[] {
  const views: CappedSlaQuotaView[] = [];
  for (const item of items) {
    views.push(toCappedSlaQuotaView(item));
  }
  return views;
}

export function sumCappedSlaQuotaView(view: CappedSlaQuotaView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  return parsedClicks;
}
