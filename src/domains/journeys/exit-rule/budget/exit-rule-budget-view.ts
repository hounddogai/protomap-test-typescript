import { ExitRuleBudget } from "./exit-rule-budget.js";

/** How screens and exports show a exit rule budget. */
export class ExitRuleBudgetView {
  codeText: string;
  titleText: string;
  cohort: string;
  sendAt: string;
  category: string;
  quantity: string;
  phone: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    cohort: string,
    sendAt: string,
    category: string,
    quantity: string,
    phone: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.category = category;
    this.quantity = quantity;
    this.phone = phone;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleBudgetView(item: ExitRuleBudget): ExitRuleBudgetView {
  return new ExitRuleBudgetView(
    item.code,
    item.title,
    item.cohort,
    String(item.sendAt),
    item.category,
    String(item.quantity),
    item.phone,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleBudgetViews(items: ExitRuleBudget[]): ExitRuleBudgetView[] {
  const views: ExitRuleBudgetView[] = [];
  for (const item of items) {
    views.push(toExitRuleBudgetView(item));
  }
  return views;
}

export function sumExitRuleBudgetView(view: ExitRuleBudgetView): number {
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedSendAt + parsedQuantity;
}
