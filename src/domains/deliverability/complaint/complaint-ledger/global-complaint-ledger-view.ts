import * as text from "../../../../kit/text.js";
import { GlobalComplaintLedger } from "./global-complaint-ledger.js";

/** How screens and exports show a global complaint ledger. */
export class GlobalComplaintLedgerView {
  code: string;
  label: string;
  cost: string;
  phone: string;
  conversionRateText: string;
  amount: string;
  bid: string;
  externalRef: string;
  activeText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    cost: string,
    phone: string,
    conversionRateText: string,
    amount: string,
    bid: string,
    externalRef: string,
    activeText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.phone = phone;
    this.conversionRateText = conversionRateText;
    this.amount = amount;
    this.bid = bid;
    this.externalRef = externalRef;
    this.activeText = activeText;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalComplaintLedgerView(item: GlobalComplaintLedger): GlobalComplaintLedgerView {
  return new GlobalComplaintLedgerView(
    item.code,
    text.truncate(item.label, 40),
    item.cost.toFixed(2),
    item.phone,
    item.conversionRate.toFixed(2),
    item.amount.toFixed(2),
    item.bid.toFixed(2),
    item.externalRef,
    `${item.active}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalComplaintLedgerViews(items: GlobalComplaintLedger[]): GlobalComplaintLedgerView[] {
  const views: GlobalComplaintLedgerView[] = [];
  for (const item of items) {
    views.push(toGlobalComplaintLedgerView(item));
  }
  return views;
}

export function sumGlobalComplaintLedgerView(view: GlobalComplaintLedgerView): number {
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  const parsedConversionRate = Number(view.conversionRateText);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRateText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedCost + parsedConversionRate + parsedAmount;
}
