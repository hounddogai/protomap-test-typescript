import * as text from "../../../../kit/text.js";
import { SlaRule } from "./sla-rule.js";

/** How screens and exports show a sla rule. */
export class SlaRuleView {
  codeText: string;
  label: string;
  clicksText: string;
  cost: string;
  statusLabel: string;

  constructor(codeText: string, label: string, clicksText: string, cost: string, statusLabel: string) {
    this.codeText = codeText;
    this.label = label;
    this.clicksText = clicksText;
    this.cost = cost;
    this.statusLabel = statusLabel;
  }
}

export function toSlaRuleView(item: SlaRule): SlaRuleView {
  return new SlaRuleView(
    item.code,
    text.truncate(item.label, 120),
    String(item.clicks),
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaRuleViews(items: SlaRule[]): SlaRuleView[] {
  const views: SlaRuleView[] = [];
  for (const item of items) {
    views.push(toSlaRuleView(item));
  }
  return views;
}

export function sumSlaRuleView(view: SlaRuleView): number {
  const parsedClicks = Number(view.clicksText);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicksText} is not a number`);
  const parsedCost = Number(view.cost);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.cost} is not a number`);
  return parsedClicks + parsedCost;
}
