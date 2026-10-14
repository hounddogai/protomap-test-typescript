import * as text from "../../../../kit/text.js";
import { PrimaryTicketViewSchedule } from "./primary-ticket-view-schedule.js";

/** How screens and exports show a primary ticket view schedule. */
export class PrimaryTicketViewScheduleView {
  code: string;
  label: string;
  ownerId: string;
  country: string;
  openRate: string;
  maximumText: string;
  currency: string;
  pinned: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    ownerId: string,
    country: string,
    openRate: string,
    maximumText: string,
    currency: string,
    pinned: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.ownerId = ownerId;
    this.country = country;
    this.openRate = openRate;
    this.maximumText = maximumText;
    this.currency = currency;
    this.pinned = pinned;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryTicketViewScheduleView(item: PrimaryTicketViewSchedule): PrimaryTicketViewScheduleView {
  return new PrimaryTicketViewScheduleView(
    text.truncate(item.code, 40),
    item.label,
    item.ownerId,
    item.country,
    item.openRate.toFixed(2),
    item.maximum.toFixed(2),
    text.truncate(item.currency, 64),
    `${item.pinned}`,
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryTicketViewScheduleViews(items: PrimaryTicketViewSchedule[]): PrimaryTicketViewScheduleView[] {
  const views: PrimaryTicketViewScheduleView[] = [];
  for (const item of items) {
    views.push(toPrimaryTicketViewScheduleView(item));
  }
  return views;
}

export function sumPrimaryTicketViewScheduleView(view: PrimaryTicketViewScheduleView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedMaximum = Number(view.maximumText);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximumText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedOpenRate + parsedMaximum + parsedBid;
}
