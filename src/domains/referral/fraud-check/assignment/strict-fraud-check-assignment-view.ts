import * as text from "../../../../kit/text.js";
import { StrictFraudCheckAssignment } from "./strict-fraud-check-assignment.js";

/** How screens and exports show a strict fraud check assignment. */
export class StrictFraudCheckAssignmentView {
  code: string;
  name: string;
  currency: string;
  discount: string;
  locale: string;
  statusLabel: string;

  constructor(code: string, name: string, currency: string, discount: string, locale: string, statusLabel: string) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.discount = discount;
    this.locale = locale;
    this.statusLabel = statusLabel;
  }
}

export function toStrictFraudCheckAssignmentView(item: StrictFraudCheckAssignment): StrictFraudCheckAssignmentView {
  return new StrictFraudCheckAssignmentView(
    text.truncate(item.code, 40),
    item.name,
    item.currency,
    item.discount.toFixed(2),
    item.locale,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictFraudCheckAssignmentViews(items: StrictFraudCheckAssignment[]): StrictFraudCheckAssignmentView[] {
  const views: StrictFraudCheckAssignmentView[] = [];
  for (const item of items) {
    views.push(toStrictFraudCheckAssignmentView(item));
  }
  return views;
}

export function sumStrictFraudCheckAssignmentView(view: StrictFraudCheckAssignmentView): number {
  const parsedDiscount = Number(view.discount);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discount} is not a number`);
  return parsedDiscount;
}
