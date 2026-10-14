import * as text from "../../../../kit/text.js";
import { SuppressionAgreement } from "./suppression-agreement.js";

/** How screens and exports show a suppression agreement. */
export class SuppressionAgreementView {
  code: string;
  name: string;
  journeyId: string;
  active: string;
  summaryText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    active: string,
    summaryText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.active = active;
    this.summaryText = summaryText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toSuppressionAgreementView(item: SuppressionAgreement): SuppressionAgreementView {
  return new SuppressionAgreementView(
    item.code,
    text.truncate(item.name, 40),
    text.truncate(item.journeyId, 64),
    `${item.active}`,
    item.summary,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSuppressionAgreementViews(items: SuppressionAgreement[]): SuppressionAgreementView[] {
  const views: SuppressionAgreementView[] = [];
  for (const item of items) {
    views.push(toSuppressionAgreementView(item));
  }
  return views;
}

export function sumSuppressionAgreementView(view: SuppressionAgreementView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
