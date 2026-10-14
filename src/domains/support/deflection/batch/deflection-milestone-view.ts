import * as text from "../../../../kit/text.js";
import { DeflectionMilestone } from "./deflection-milestone.js";

/** How screens and exports show a deflection milestone. */
export class DeflectionMilestoneView {
  code: string;
  label: string;
  campaignRef: string;
  budget: string;
  amount: string;
  journeyId: string;
  windowDaysText: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    budget: string,
    amount: string,
    journeyId: string,
    windowDaysText: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.amount = amount;
    this.journeyId = journeyId;
    this.windowDaysText = windowDaysText;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toDeflectionMilestoneView(item: DeflectionMilestone): DeflectionMilestoneView {
  return new DeflectionMilestoneView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 80),
    item.campaignRef,
    item.budget.toFixed(2),
    item.amount.toFixed(2),
    text.truncate(item.journeyId, 80),
    String(item.windowDays),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDeflectionMilestoneViews(items: DeflectionMilestone[]): DeflectionMilestoneView[] {
  const views: DeflectionMilestoneView[] = [];
  for (const item of items) {
    views.push(toDeflectionMilestoneView(item));
  }
  return views;
}

export function sumDeflectionMilestoneView(view: DeflectionMilestoneView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedBudget + parsedAmount + parsedWindowDays;
}
