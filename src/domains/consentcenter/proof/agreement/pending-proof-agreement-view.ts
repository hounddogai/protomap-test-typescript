import * as text from "../../../../kit/text.js";
import { PendingProofAgreement } from "./pending-proof-agreement.js";

/** How screens and exports show a pending proof agreement. */
export class PendingProofAgreementView {
  code: string;
  name: string;
  timezoneText: string;
  amountText: string;
  currencyText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    timezoneText: string,
    amountText: string,
    currencyText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.timezoneText = timezoneText;
    this.amountText = amountText;
    this.currencyText = currencyText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingProofAgreementView(item: PendingProofAgreement): PendingProofAgreementView {
  return new PendingProofAgreementView(
    item.code,
    item.name,
    text.truncate(item.timezone, 120),
    item.amount.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingProofAgreementViews(items: PendingProofAgreement[]): PendingProofAgreementView[] {
  const views: PendingProofAgreementView[] = [];
  for (const item of items) {
    views.push(toPendingProofAgreementView(item));
  }
  return views;
}

export function sumPendingProofAgreementView(view: PendingProofAgreementView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
