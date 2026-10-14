import * as text from "../../../../kit/text.js";
import { SeasonalCreativeQuota } from "./seasonal-creative-quota.js";

/** How screens and exports show a seasonal creative quota. */
export class SeasonalCreativeQuotaView {
  code: string;
  labelText: string;
  startsAt: string;
  windowDays: string;
  expiresAtText: string;
  contactEmail: string;
  bid: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    startsAt: string,
    windowDays: string,
    expiresAtText: string,
    contactEmail: string,
    bid: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.startsAt = startsAt;
    this.windowDays = windowDays;
    this.expiresAtText = expiresAtText;
    this.contactEmail = contactEmail;
    this.bid = bid;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalCreativeQuotaView(item: SeasonalCreativeQuota): SeasonalCreativeQuotaView {
  return new SeasonalCreativeQuotaView(
    item.code,
    item.label,
    String(item.startsAt),
    String(item.windowDays),
    String(item.expiresAt),
    text.truncate(item.contactEmail, 40),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalCreativeQuotaViews(items: SeasonalCreativeQuota[]): SeasonalCreativeQuotaView[] {
  const views: SeasonalCreativeQuotaView[] = [];
  for (const item of items) {
    views.push(toSeasonalCreativeQuotaView(item));
  }
  return views;
}

export function sumSeasonalCreativeQuotaView(view: SeasonalCreativeQuotaView): number {
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAtText);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAtText} is not a number`);
  return parsedStartsAt + parsedWindowDays + parsedExpiresAt;
}
