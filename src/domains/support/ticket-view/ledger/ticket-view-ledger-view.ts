import { TicketViewLedger } from "./ticket-view-ledger.js";

/** How screens and exports show a ticket view ledger. */
export class TicketViewLedgerView {
  code: string;
  nameText: string;
  openRate: string;
  clicks: string;
  windowDays: string;
  floorValue: string;
  weight: string;
  ownerId: string;
  channel: string;
  retries: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    openRate: string,
    clicks: string,
    windowDays: string,
    floorValue: string,
    weight: string,
    ownerId: string,
    channel: string,
    retries: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.openRate = openRate;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.floorValue = floorValue;
    this.weight = weight;
    this.ownerId = ownerId;
    this.channel = channel;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toTicketViewLedgerView(item: TicketViewLedger): TicketViewLedgerView {
  return new TicketViewLedgerView(
    item.code,
    item.name,
    item.openRate.toFixed(2),
    String(item.clicks),
    String(item.windowDays),
    item.floorValue.toFixed(2),
    item.weight.toFixed(2),
    item.ownerId,
    item.channel,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toTicketViewLedgerViews(items: TicketViewLedger[]): TicketViewLedgerView[] {
  const views: TicketViewLedgerView[] = [];
  for (const item of items) {
    views.push(toTicketViewLedgerView(item));
  }
  return views;
}

export function sumTicketViewLedgerView(view: TicketViewLedgerView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedOpenRate + parsedClicks + parsedWindowDays;
}
