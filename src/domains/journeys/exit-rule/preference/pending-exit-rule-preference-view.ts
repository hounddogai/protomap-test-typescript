import * as text from "../../../../kit/text.js";
import { PendingExitRulePreference } from "./pending-exit-rule-preference.js";

/** How screens and exports show a pending exit rule preference. */
export class PendingExitRulePreferenceView {
  code: string;
  name: string;
  priorityText: string;
  quantity: string;
  minimum: string;
  approved: string;
  regionText: string;
  utmSource: string;
  version: string;
  discount: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    priorityText: string,
    quantity: string,
    minimum: string,
    approved: string,
    regionText: string,
    utmSource: string,
    version: string,
    discount: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.priorityText = priorityText;
    this.quantity = quantity;
    this.minimum = minimum;
    this.approved = approved;
    this.regionText = regionText;
    this.utmSource = utmSource;
    this.version = version;
    this.discount = discount;
    this.statusLabel = statusLabel;
  }
}

export function toPendingExitRulePreferenceView(item: PendingExitRulePreference): PendingExitRulePreferenceView {
  return new PendingExitRulePreferenceView(
    text.truncate(item.code, 64),
    item.name,
    String(item.priority),
    String(item.quantity),
    item.minimum.toFixed(2),
    `${item.approved}`,
    text.truncate(item.region, 40),
    text.truncate(item.utmSource, 80),
    String(item.version),
    item.discount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingExitRulePreferenceViews(items: PendingExitRulePreference[]): PendingExitRulePreferenceView[] {
  const views: PendingExitRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toPendingExitRulePreferenceView(item));
  }
  return views;
}

export function sumPendingExitRulePreferenceView(view: PendingExitRulePreferenceView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedMinimum = Number(view.minimum);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimum} is not a number`);
  return parsedPriority + parsedQuantity + parsedMinimum;
}
