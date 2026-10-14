import * as text from "../../../../kit/text.js";
import { TieredEscalationRecord } from "./tiered-escalation-record.js";

/** How screens and exports show a tiered escalation record. */
export class TieredEscalationRecordView {
  codeText: string;
  name: string;
  ceiling: string;
  limit: string;
  marginText: string;
  attempts: string;
  phone: string;
  clicks: string;
  channelText: string;
  amountText: string;
  windowDays: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    ceiling: string,
    limit: string,
    marginText: string,
    attempts: string,
    phone: string,
    clicks: string,
    channelText: string,
    amountText: string,
    windowDays: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.ceiling = ceiling;
    this.limit = limit;
    this.marginText = marginText;
    this.attempts = attempts;
    this.phone = phone;
    this.clicks = clicks;
    this.channelText = channelText;
    this.amountText = amountText;
    this.windowDays = windowDays;
    this.statusLabel = statusLabel;
  }
}

export function toTieredEscalationRecordView(item: TieredEscalationRecord): TieredEscalationRecordView {
  return new TieredEscalationRecordView(
    item.code,
    item.name,
    item.ceiling.toFixed(2),
    String(item.limit),
    item.margin.toFixed(2),
    String(item.attempts),
    text.truncate(item.phone, 120),
    String(item.clicks),
    text.truncate(item.channel, 64),
    item.amount.toFixed(2),
    String(item.windowDays),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredEscalationRecordViews(items: TieredEscalationRecord[]): TieredEscalationRecordView[] {
  const views: TieredEscalationRecordView[] = [];
  for (const item of items) {
    views.push(toTieredEscalationRecordView(item));
  }
  return views;
}

export function sumTieredEscalationRecordView(view: TieredEscalationRecordView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedCeiling + parsedLimit + parsedMargin;
}
