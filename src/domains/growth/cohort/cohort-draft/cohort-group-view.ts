import * as text from "../../../../kit/text.js";
import { CohortGroup } from "./cohort-group.js";

/** How screens and exports show a cohort group. */
export class CohortGroupView {
  code: string;
  labelText: string;
  phone: string;
  title: string;
  currency: string;
  amountText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    phone: string,
    title: string,
    currency: string,
    amountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.phone = phone;
    this.title = title;
    this.currency = currency;
    this.amountText = amountText;
    this.statusLabel = statusLabel;
  }
}

export function toCohortGroupView(item: CohortGroup): CohortGroupView {
  return new CohortGroupView(
    item.code,
    item.label,
    text.truncate(item.phone, 80),
    text.truncate(item.title, 64),
    text.truncate(item.currency, 120),
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCohortGroupViews(items: CohortGroup[]): CohortGroupView[] {
  const views: CohortGroupView[] = [];
  for (const item of items) {
    views.push(toCohortGroupView(item));
  }
  return views;
}

export function sumCohortGroupView(view: CohortGroupView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  return parsedAmount;
}
