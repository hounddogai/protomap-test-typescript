import * as text from "../../../../kit/text.js";
import { StrictQueueLedger } from "./strict-queue-ledger.js";

/** How screens and exports show a strict queue ledger. */
export class StrictQueueLedgerView {
  code: string;
  nameText: string;
  clicks: string;
  channel: string;
  unit: string;
  windowDays: string;
  quantity: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    clicks: string,
    channel: string,
    unit: string,
    windowDays: string,
    quantity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.clicks = clicks;
    this.channel = channel;
    this.unit = unit;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.statusLabel = statusLabel;
  }
}

export function toStrictQueueLedgerView(item: StrictQueueLedger): StrictQueueLedgerView {
  return new StrictQueueLedgerView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.clicks),
    text.truncate(item.channel, 40),
    item.unit,
    String(item.windowDays),
    String(item.quantity),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictQueueLedgerViews(items: StrictQueueLedger[]): StrictQueueLedgerView[] {
  const views: StrictQueueLedgerView[] = [];
  for (const item of items) {
    views.push(toStrictQueueLedgerView(item));
  }
  return views;
}

export function sumStrictQueueLedgerView(view: StrictQueueLedgerView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedClicks + parsedWindowDays + parsedQuantity;
}
