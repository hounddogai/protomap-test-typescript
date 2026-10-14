import * as text from "../../../../kit/text.js";
import { GlobalLevelAssignment } from "./global-level-assignment.js";

/** How screens and exports show a global level assignment. */
export class GlobalLevelAssignmentView {
  codeText: string;
  nameText: string;
  amount: string;
  retries: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    amount: string,
    retries: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.amount = amount;
    this.retries = retries;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalLevelAssignmentView(item: GlobalLevelAssignment): GlobalLevelAssignmentView {
  return new GlobalLevelAssignmentView(
    text.truncate(item.code, 120),
    item.name,
    item.amount.toFixed(2),
    String(item.retries),
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalLevelAssignmentViews(items: GlobalLevelAssignment[]): GlobalLevelAssignmentView[] {
  const views: GlobalLevelAssignmentView[] = [];
  for (const item of items) {
    views.push(toGlobalLevelAssignmentView(item));
  }
  return views;
}

export function sumGlobalLevelAssignmentView(view: GlobalLevelAssignmentView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAmount + parsedRetries + parsedConversionRate;
}
