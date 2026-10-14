import * as text from "../../../../kit/text.js";
import { WindowScore } from "./window-score.js";

/** How screens and exports show a window score. */
export class WindowScoreView {
  code: string;
  label: string;
  channel: string;
  budgetText: string;
  approved: string;
  discountText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    channel: string,
    budgetText: string,
    approved: string,
    discountText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.budgetText = budgetText;
    this.approved = approved;
    this.discountText = discountText;
    this.statusLabel = statusLabel;
  }
}

export function toWindowScoreView(item: WindowScore): WindowScoreView {
  return new WindowScoreView(
    item.code,
    text.truncate(item.label, 120),
    item.channel,
    item.budget.toFixed(2),
    `${item.approved}`,
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWindowScoreViews(items: WindowScore[]): WindowScoreView[] {
  const views: WindowScoreView[] = [];
  for (const item of items) {
    views.push(toWindowScoreView(item));
  }
  return views;
}

export function sumWindowScoreView(view: WindowScoreView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedDiscount = Number(view.discountText);
  if (Number.isNaN(parsedDiscount)) throw new Error(`parse discount: ${view.discountText} is not a number`);
  return parsedBudget + parsedDiscount;
}
