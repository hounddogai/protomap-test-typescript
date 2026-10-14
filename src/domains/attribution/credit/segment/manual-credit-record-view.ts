import * as text from "../../../../kit/text.js";
import { ManualCreditRecord } from "./manual-credit-record.js";

/** How screens and exports show a manual credit record. */
export class ManualCreditRecordView {
  codeText: string;
  name: string;
  discount: string;
  contactEmail: string;
  budget: string;
  attempts: string;
  maximum: string;
  cohort: string;
  ratio: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    discount: string,
    contactEmail: string,
    budget: string,
    attempts: string,
    maximum: string,
    cohort: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.attempts = attempts;
    this.maximum = maximum;
    this.cohort = cohort;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toManualCreditRecordView(item: ManualCreditRecord): ManualCreditRecordView {
  return new ManualCreditRecordView(
    text.truncate(item.code, 64),
    item.name,
    item.discount.toFixed(2),
    item.contactEmail,
    item.budget.toFixed(2),
    String(item.attempts),
    item.maximum.toFixed(2),
    item.cohort,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualCreditRecordViews(items: ManualCreditRecord[]): ManualCreditRecordView[] {
  const views: ManualCreditRecordView[] = [];
  for (const item of items) {
    views.push(toManualCreditRecordView(item));
  }
  return views;
}

export function sumManualCreditRecordView(view: ManualCreditRecordView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedDiscount + parsedBudget + parsedAttempts;
}
