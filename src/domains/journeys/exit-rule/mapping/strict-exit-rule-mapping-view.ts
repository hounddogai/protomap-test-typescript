import * as text from "../../../../kit/text.js";
import { StrictExitRuleMapping } from "./strict-exit-rule-mapping.js";

/** How screens and exports show a strict exit rule mapping. */
export class StrictExitRuleMappingView {
  codeText: string;
  title: string;
  unitText: string;
  region: string;
  maximum: string;
  quantity: string;
  reviewer: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    unitText: string,
    region: string,
    maximum: string,
    quantity: string,
    reviewer: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.unitText = unitText;
    this.region = region;
    this.maximum = maximum;
    this.quantity = quantity;
    this.reviewer = reviewer;
    this.statusLabel = statusLabel;
  }
}

export function toStrictExitRuleMappingView(item: StrictExitRuleMapping): StrictExitRuleMappingView {
  return new StrictExitRuleMappingView(
    item.code,
    item.title,
    item.unit,
    text.truncate(item.region, 80),
    item.maximum.toFixed(2),
    String(item.quantity),
    item.reviewer,
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictExitRuleMappingViews(items: StrictExitRuleMapping[]): StrictExitRuleMappingView[] {
  const views: StrictExitRuleMappingView[] = [];
  for (const item of items) {
    views.push(toStrictExitRuleMappingView(item));
  }
  return views;
}

export function sumStrictExitRuleMappingView(view: StrictExitRuleMappingView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  return parsedMaximum + parsedQuantity;
}
