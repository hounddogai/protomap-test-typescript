import { EnrollmentTemplate } from "./enrollment-template.js";

/** How screens and exports show a enrollment template. */
export class EnrollmentTemplateView {
  code: string;
  name: string;
  pinned: string;
  currencyText: string;
  segmentText: string;
  amount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    pinned: string,
    currencyText: string,
    segmentText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.currencyText = currencyText;
    this.segmentText = segmentText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toEnrollmentTemplateView(item: EnrollmentTemplate): EnrollmentTemplateView {
  return new EnrollmentTemplateView(
    item.code,
    item.name,
    `${item.pinned}`,
    item.currency,
    item.segment,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toEnrollmentTemplateViews(items: EnrollmentTemplate[]): EnrollmentTemplateView[] {
  const views: EnrollmentTemplateView[] = [];
  for (const item of items) {
    views.push(toEnrollmentTemplateView(item));
  }
  return views;
}

export function sumEnrollmentTemplateView(view: EnrollmentTemplateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
