import * as text from "../../../../kit/text.js";
import { PrimaryMacroQuota } from "./primary-macro-quota.js";

/** How screens and exports show a primary macro quota. */
export class PrimaryMacroQuotaView {
  code: string;
  nameText: string;
  amountText: string;
  graceDays: string;
  budget: string;
  ceiling: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    amountText: string,
    graceDays: string,
    budget: string,
    ceiling: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.amountText = amountText;
    this.graceDays = graceDays;
    this.budget = budget;
    this.ceiling = ceiling;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryMacroQuotaView(item: PrimaryMacroQuota): PrimaryMacroQuotaView {
  return new PrimaryMacroQuotaView(
    text.truncate(item.code, 80),
    item.name,
    item.amount.toFixed(2),
    String(item.graceDays),
    item.budget.toFixed(2),
    item.ceiling.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryMacroQuotaViews(items: PrimaryMacroQuota[]): PrimaryMacroQuotaView[] {
  const views: PrimaryMacroQuotaView[] = [];
  for (const item of items) {
    views.push(toPrimaryMacroQuotaView(item));
  }
  return views;
}

export function sumPrimaryMacroQuotaView(view: PrimaryMacroQuotaView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedAmount + parsedGraceDays + parsedBudget;
}
