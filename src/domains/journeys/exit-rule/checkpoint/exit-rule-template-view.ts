import * as text from "../../../../kit/text.js";
import { ExitRuleTemplate } from "./exit-rule-template.js";

/** How screens and exports show a exit rule template. */
export class ExitRuleTemplateView {
  codeText: string;
  name: string;
  journeyIdText: string;
  reviewer: string;
  category: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    journeyIdText: string,
    reviewer: string,
    category: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.journeyIdText = journeyIdText;
    this.reviewer = reviewer;
    this.category = category;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleTemplateView(item: ExitRuleTemplate): ExitRuleTemplateView {
  return new ExitRuleTemplateView(
    text.truncate(item.code, 80),
    item.name,
    text.truncate(item.journeyId, 120),
    item.reviewer,
    item.category,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleTemplateViews(items: ExitRuleTemplate[]): ExitRuleTemplateView[] {
  const views: ExitRuleTemplateView[] = [];
  for (const item of items) {
    views.push(toExitRuleTemplateView(item));
  }
  return views;
}

export function sumExitRuleTemplateView(view: ExitRuleTemplateView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
