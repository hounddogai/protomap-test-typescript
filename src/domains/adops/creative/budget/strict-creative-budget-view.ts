import * as text from "../../../../kit/text.js";
import { StrictCreativeBudget } from "./strict-creative-budget.js";

/** How screens and exports show a strict creative budget. */
export class StrictCreativeBudgetView {
  code: string;
  label: string;
  title: string;
  priority: string;
  channel: string;
  currency: string;
  visibleText: string;
  ratio: string;
  amount: string;
  journeyId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    title: string,
    priority: string,
    channel: string,
    currency: string,
    visibleText: string,
    ratio: string,
    amount: string,
    journeyId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.priority = priority;
    this.channel = channel;
    this.currency = currency;
    this.visibleText = visibleText;
    this.ratio = ratio;
    this.amount = amount;
    this.journeyId = journeyId;
    this.statusLabel = statusLabel;
  }
}

export function toStrictCreativeBudgetView(item: StrictCreativeBudget): StrictCreativeBudgetView {
  return new StrictCreativeBudgetView(
    text.truncate(item.code, 80),
    item.label,
    text.truncate(item.title, 64),
    String(item.priority),
    item.channel,
    item.currency,
    `${item.visible}`,
    item.ratio.toFixed(2),
    item.amount.toFixed(2),
    text.truncate(item.journeyId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictCreativeBudgetViews(items: StrictCreativeBudget[]): StrictCreativeBudgetView[] {
  const views: StrictCreativeBudgetView[] = [];
  for (const item of items) {
    views.push(toStrictCreativeBudgetView(item));
  }
  return views;
}

export function sumStrictCreativeBudgetView(view: StrictCreativeBudgetView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedPriority + parsedRatio + parsedAmount;
}
