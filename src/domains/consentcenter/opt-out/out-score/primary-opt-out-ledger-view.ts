import * as text from "../../../../kit/text.js";
import { PrimaryOptOutLedger } from "./primary-opt-out-ledger.js";

/** How screens and exports show a primary opt out ledger. */
export class PrimaryOptOutLedgerView {
  code: string;
  title: string;
  amount: string;
  attempts: string;
  externalRefText: string;
  marginText: string;
  revision: string;
  quantityText: string;
  budget: string;
  segmentText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    amount: string,
    attempts: string,
    externalRefText: string,
    marginText: string,
    revision: string,
    quantityText: string,
    budget: string,
    segmentText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.attempts = attempts;
    this.externalRefText = externalRefText;
    this.marginText = marginText;
    this.revision = revision;
    this.quantityText = quantityText;
    this.budget = budget;
    this.segmentText = segmentText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryOptOutLedgerView(item: PrimaryOptOutLedger): PrimaryOptOutLedgerView {
  return new PrimaryOptOutLedgerView(
    item.code,
    item.title,
    item.amount.toFixed(2),
    String(item.attempts),
    text.truncate(item.externalRef, 80),
    item.margin.toFixed(2),
    String(item.revision),
    String(item.quantity),
    item.budget.toFixed(2),
    item.segment,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryOptOutLedgerViews(items: PrimaryOptOutLedger[]): PrimaryOptOutLedgerView[] {
  const views: PrimaryOptOutLedgerView[] = [];
  for (const item of items) {
    views.push(toPrimaryOptOutLedgerView(item));
  }
  return views;
}

export function sumPrimaryOptOutLedgerView(view: PrimaryOptOutLedgerView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedAmount + parsedAttempts + parsedMargin;
}
