import * as text from "../../../../kit/text.js";
import { PendingDomainThreshold } from "./pending-domain-threshold.js";

/** How screens and exports show a pending domain threshold. */
export class PendingDomainThresholdView {
  code: string;
  name: string;
  durationMinutes: string;
  locale: string;
  channel: string;
  openRate: string;
  cost: string;
  pinned: string;
  phone: string;
  version: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    durationMinutes: string,
    locale: string,
    channel: string,
    openRate: string,
    cost: string,
    pinned: string,
    phone: string,
    version: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.channel = channel;
    this.openRate = openRate;
    this.cost = cost;
    this.pinned = pinned;
    this.phone = phone;
    this.version = version;
    this.statusLabel = statusLabel;
  }
}

export function toPendingDomainThresholdView(item: PendingDomainThreshold): PendingDomainThresholdView {
  return new PendingDomainThresholdView(
    text.truncate(item.code, 64),
    item.name,
    String(item.durationMinutes),
    item.locale,
    item.channel,
    item.openRate.toFixed(2),
    item.cost.toFixed(2),
    `${item.pinned}`,
    item.phone,
    String(item.version),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingDomainThresholdViews(items: PendingDomainThreshold[]): PendingDomainThresholdView[] {
  const views: PendingDomainThresholdView[] = [];
  for (const item of items) {
    views.push(toPendingDomainThresholdView(item));
  }
  return views;
}

export function sumPendingDomainThresholdView(view: PendingDomainThresholdView): number {
  const parsedDurationMinutes = Number(view.durationMinutes);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutes} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedDurationMinutes + parsedOpenRate + parsedCost;
}
