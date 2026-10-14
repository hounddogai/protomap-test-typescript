import * as text from "../../../../kit/text.js";
import { PendingBidRulePreference } from "./pending-bid-rule-preference.js";

/** How screens and exports show a pending bid rule preference. */
export class PendingBidRulePreferenceView {
  codeText: string;
  label: string;
  budget: string;
  reviewer: string;
  quantity: string;
  windowDays: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    budget: string,
    reviewer: string,
    quantity: string,
    windowDays: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.budget = budget;
    this.reviewer = reviewer;
    this.quantity = quantity;
    this.windowDays = windowDays;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toPendingBidRulePreferenceView(item: PendingBidRulePreference): PendingBidRulePreferenceView {
  return new PendingBidRulePreferenceView(
    item.code,
    item.label,
    item.budget.toFixed(2),
    item.reviewer,
    String(item.quantity),
    String(item.windowDays),
    text.truncate(item.utmSource, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingBidRulePreferenceViews(items: PendingBidRulePreference[]): PendingBidRulePreferenceView[] {
  const views: PendingBidRulePreferenceView[] = [];
  for (const item of items) {
    views.push(toPendingBidRulePreferenceView(item));
  }
  return views;
}

export function sumPendingBidRulePreferenceView(view: PendingBidRulePreferenceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  return parsedBudget + parsedQuantity + parsedWindowDays;
}
