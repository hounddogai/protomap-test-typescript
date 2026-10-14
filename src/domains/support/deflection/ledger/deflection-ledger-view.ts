import * as text from "../../../../kit/text.js";
import { DeflectionLedger } from "./deflection-ledger.js";

/** How screens and exports show a deflection ledger. */
export class DeflectionLedgerView {
  code: string;
  nameText: string;
  visible: string;
  score: string;
  costText: string;
  bidText: string;
  ceilingText: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    visible: string,
    score: string,
    costText: string,
    bidText: string,
    ceilingText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.visible = visible;
    this.score = score;
    this.costText = costText;
    this.bidText = bidText;
    this.ceilingText = ceilingText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionLedgerView(item: DeflectionLedger): DeflectionLedgerView {
  return new DeflectionLedgerView(
    text.truncate(item.code, 80),
    item.name,
    `${item.visible}`,
    item.score.toFixed(2),
    item.cost.toFixed(2),
    item.bid.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionLedgerViews(items: DeflectionLedger[]): DeflectionLedgerView[] {
  const views: DeflectionLedgerView[] = [];
  for (const item of items) {
    views.push(toDeflectionLedgerView(item));
  }
  return views;
}

export function sumDeflectionLedgerView(view: DeflectionLedgerView): number {
  const parsedScore = Number(view.score);
  if (Number.isNaN(parsedScore)) throw new Error(`parse score: ${view.score} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedBid = Number(view.bidText);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bidText} is not a number`);
  return parsedScore + parsedCost + parsedBid;
}
