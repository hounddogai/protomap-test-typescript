import * as text from "../../../../kit/text.js";
import { TicketViewAudit } from "./ticket-view-audit.js";

/** How screens and exports show a ticket view audit. */
export class TicketViewAuditView {
  code: string;
  title: string;
  channelText: string;
  segment: string;
  bid: string;
  floorValue: string;
  windowDays: string;
  margin: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    channelText: string,
    segment: string,
    bid: string,
    floorValue: string,
    windowDays: string,
    margin: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.channelText = channelText;
    this.segment = segment;
    this.bid = bid;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.margin = margin;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewAuditView(item: TicketViewAudit): TicketViewAuditView {
  return new TicketViewAuditView(
    item.code,
    item.title,
    text.truncate(item.channel, 40),
    item.segment,
    item.bid.toFixed(2),
    item.floorValue.toFixed(2),
    String(item.windowDays),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewAuditViews(items: TicketViewAudit[]): TicketViewAuditView[] {
  const views: TicketViewAuditView[] = [];
  for (const item of items) {
    views.push(toTicketViewAuditView(item));
  }
  return views;
}

export function sumTicketViewAuditView(view: TicketViewAuditView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBid + parsedFloorValue + parsedWindowDays;
}
