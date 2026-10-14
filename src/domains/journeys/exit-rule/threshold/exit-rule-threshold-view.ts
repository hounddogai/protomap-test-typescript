import * as text from "../../../../kit/text.js";
import { ExitRuleThreshold } from "./exit-rule-threshold.js";

/** How screens and exports show a exit rule threshold. */
export class ExitRuleThresholdView {
  code: string;
  nameText: string;
  bid: string;
  summary: string;
  maximum: string;
  unitText: string;
  budget: string;
  frequencyCap: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    bid: string,
    summary: string,
    maximum: string,
    unitText: string,
    budget: string,
    frequencyCap: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.bid = bid;
    this.summary = summary;
    this.maximum = maximum;
    this.unitText = unitText;
    this.budget = budget;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleThresholdView(item: ExitRuleThreshold): ExitRuleThresholdView {
  return new ExitRuleThresholdView(
    text.truncate(item.code, 40),
    item.name,
    item.bid.toFixed(2),
    item.summary,
    item.maximum.toFixed(2),
    item.unit,
    item.budget.toFixed(2),
    String(item.frequencyCap),
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleThresholdViews(items: ExitRuleThreshold[]): ExitRuleThresholdView[] {
  const views: ExitRuleThresholdView[] = [];
  for (const item of items) {
    views.push(toExitRuleThresholdView(item));
  }
  return views;
}

export function sumExitRuleThresholdView(view: ExitRuleThresholdView): number {
  const parsedBid = Number(view.bid);
  if (Number.isNaN(parsedBid)) throw new Error(`parse bid: ${view.bid} is not a number`);
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedBid + parsedMaximum + parsedBudget;
}
