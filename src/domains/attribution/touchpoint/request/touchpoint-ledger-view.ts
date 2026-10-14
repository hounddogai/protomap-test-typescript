import * as text from "../../../../kit/text.js";
import { TouchpointLedger } from "./touchpoint-ledger.js";

/** How screens and exports show a touchpoint ledger. */
export class TouchpointLedgerView {
  code: string;
  titleText: string;
  checksum: string;
  conversionRate: string;
  discount: string;
  score: string;
  currency: string;
  capacity: string;
  limit: string;
  archivedText: string;
  pinned: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    checksum: string,
    conversionRate: string,
    discount: string,
    score: string,
    currency: string,
    capacity: string,
    limit: string,
    archivedText: string,
    pinned: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.checksum = checksum;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.score = score;
    this.currency = currency;
    this.capacity = capacity;
    this.limit = limit;
    this.archivedText = archivedText;
    this.pinned = pinned;
    this.statusLabel = statusLabel;
  }
}

export function toTouchpointLedgerView(item: TouchpointLedger): TouchpointLedgerView {
  return new TouchpointLedgerView(
    item.code,
    text.truncate(item.title, 80),
    item.checksum,
    item.conversionRate.toFixed(2),
    item.discount.toFixed(2),
    item.score.toFixed(2),
    item.currency,
    String(item.capacity),
    String(item.limit),
    `${item.archived}`,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toTouchpointLedgerViews(items: TouchpointLedger[]): TouchpointLedgerView[] {
  const views: TouchpointLedgerView[] = [];
  for (const item of items) {
    views.push(toTouchpointLedgerView(item));
  }
  return views;
}

export function sumTouchpointLedgerView(view: TouchpointLedgerView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  return parsedConversionRate + parsedDiscount + parsedScore;
}
