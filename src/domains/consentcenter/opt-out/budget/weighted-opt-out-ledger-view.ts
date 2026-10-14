import * as text from "../../../../kit/text.js";
import { WeightedOptOutLedger } from "./weighted-opt-out-ledger.js";

/** How screens and exports show a weighted opt out ledger. */
export class WeightedOptOutLedgerView {
  code: string;
  title: string;
  durationMinutesText: string;
  variant: string;
  currencyText: string;
  bidText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    durationMinutesText: string,
    variant: string,
    currencyText: string,
    bidText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutesText = durationMinutesText;
    this.variant = variant;
    this.currencyText = currencyText;
    this.bidText = bidText;
    this.statusLabel = statusLabel;
  }
}

export function toWeightedOptOutLedgerView(item: WeightedOptOutLedger): WeightedOptOutLedgerView {
  return new WeightedOptOutLedgerView(
    item.code,
    item.title,
    String(item.durationMinutes),
    item.variant,
    text.truncate(item.currency, 120),
    item.bid.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWeightedOptOutLedgerViews(items: WeightedOptOutLedger[]): WeightedOptOutLedgerView[] {
  const views: WeightedOptOutLedgerView[] = [];
  for (const item of items) {
    views.push(toWeightedOptOutLedgerView(item));
  }
  return views;
}

export function sumWeightedOptOutLedgerView(view: WeightedOptOutLedgerView): number {
  const parsedDurationMinutes = Number(view.durationMinutesText);
  if (Number.isNaN(parsedDurationMinutes)) throw new Error(`parse duration minutes: ${view.durationMinutesText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedDurationMinutes + parsedBid;
}
