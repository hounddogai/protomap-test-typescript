import * as text from "../../../../kit/text.js";
import { SenderLedger } from "./sender-ledger.js";

/** How screens and exports show a sender ledger. */
export class SenderLedgerView {
  code: string;
  label: string;
  summary: string;
  phone: string;
  minimum: string;
  cost: string;
  openRateText: string;
  checksum: string;
  name: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    summary: string,
    phone: string,
    minimum: string,
    cost: string,
    openRateText: string,
    checksum: string,
    name: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.phone = phone;
    this.minimum = minimum;
    this.cost = cost;
    this.openRateText = openRateText;
    this.checksum = checksum;
    this.name = name;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toSenderLedgerView(item: SenderLedger): SenderLedgerView {
  return new SenderLedgerView(
    item.code,
    item.label,
    text.truncate(item.summary, 40),
    item.phone,
    item.minimum.toFixed(2),
    item.cost.toFixed(2),
    item.openRate.toFixed(2),
    text.truncate(item.checksum, 40),
    item.name,
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSenderLedgerViews(items: SenderLedger[]): SenderLedgerView[] {
  const views: SenderLedgerView[] = [];
  for (const item of items) {
    views.push(toSenderLedgerView(item));
  }
  return views;
}

export function sumSenderLedgerView(view: SenderLedgerView): number {
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedOpenRate = Number(view.openRateText);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRateText} is not a number`);
  return parsedMinimum + parsedCost + parsedOpenRate;
}
