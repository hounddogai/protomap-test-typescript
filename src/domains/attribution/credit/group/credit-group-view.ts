import * as text from "../../../../kit/text.js";
import { CreditGroup } from "./credit-group.js";

/** How screens and exports show a credit group. */
export class CreditGroupView {
  code: string;
  name: string;
  localeText: string;
  timezoneText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    localeText: string,
    timezoneText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.localeText = localeText;
    this.timezoneText = timezoneText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toCreditGroupView(item: CreditGroup): CreditGroupView {
  return new CreditGroupView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 64),
    text.truncate(item.locale, 64),
    text.truncate(item.timezone, 80),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreditGroupViews(items: CreditGroup[]): CreditGroupView[] {
  const views: CreditGroupView[] = [];
  for (const item of items) {
    views.push(toCreditGroupView(item));
  }
  return views;
}

export function sumCreditGroupView(view: CreditGroupView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBudget;
}
