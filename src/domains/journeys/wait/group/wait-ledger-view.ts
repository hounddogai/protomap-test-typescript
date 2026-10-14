import * as text from "../../../../kit/text.js";
import { WaitLedger } from "./wait-ledger.js";

/** How screens and exports show a wait ledger. */
export class WaitLedgerView {
  code: string;
  nameText: string;
  channel: string;
  windowDays: string;
  graceDays: string;
  summary: string;
  pinned: string;
  retries: string;
  locale: string;
  scoreText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    channel: string,
    windowDays: string,
    graceDays: string,
    summary: string,
    pinned: string,
    retries: string,
    locale: string,
    scoreText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.channel = channel;
    this.windowDays = windowDays;
    this.graceDays = graceDays;
    this.summary = summary;
    this.pinned = pinned;
    this.retries = retries;
    this.locale = locale;
    this.scoreText = scoreText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitLedgerView(item: WaitLedger): WaitLedgerView {
  return new WaitLedgerView(
    item.code,
    item.name,
    text.truncate(item.channel, 64),
    String(item.windowDays),
    String(item.graceDays),
    item.summary,
    `${item.pinned}`,
    String(item.retries),
    text.truncate(item.locale, 80),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitLedgerViews(items: WaitLedger[]): WaitLedgerView[] {
  const views: WaitLedgerView[] = [];
  for (const item of items) {
    views.push(toWaitLedgerView(item));
  }
  return views;
}

export function sumWaitLedgerView(view: WaitLedgerView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedWindowDays + parsedGraceDays + parsedRetries;
}
