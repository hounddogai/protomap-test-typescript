import * as text from "../../../../kit/text.js";
import { RollingStreakLedger } from "./rolling-streak-ledger.js";

/** How screens and exports show a rolling streak ledger. */
export class RollingStreakLedgerView {
  code: string;
  title: string;
  source: string;
  utmSource: string;
  windowDaysText: string;
  campaignRef: string;
  expiresAt: string;
  floorValue: string;
  sequence: string;
  country: string;
  locale: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    source: string,
    utmSource: string,
    windowDaysText: string,
    campaignRef: string,
    expiresAt: string,
    floorValue: string,
    sequence: string,
    country: string,
    locale: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.utmSource = utmSource;
    this.windowDaysText = windowDaysText;
    this.campaignRef = campaignRef;
    this.expiresAt = expiresAt;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.country = country;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toRollingStreakLedgerView(item: RollingStreakLedger): RollingStreakLedgerView {
  return new RollingStreakLedgerView(
    item.code,
    item.title,
    item.source,
    text.truncate(item.utmSource, 40),
    String(item.windowDays),
    item.campaignRef,
    String(item.expiresAt),
    item.floorValue.toFixed(2),
    String(item.sequence),
    item.country,
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingStreakLedgerViews(items: RollingStreakLedger[]): RollingStreakLedgerView[] {
  const views: RollingStreakLedgerView[] = [];
  for (const item of items) {
    views.push(toRollingStreakLedgerView(item));
  }
  return views;
}

export function sumRollingStreakLedgerView(view: RollingStreakLedgerView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedWindowDays + parsedExpiresAt + parsedFloorValue;
}
