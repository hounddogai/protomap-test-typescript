import * as text from "../../../../kit/text.js";
import { FunnelAssignment } from "./funnel-assignment.js";

/** How screens and exports show a funnel assignment. */
export class FunnelAssignmentView {
  code: string;
  titleText: string;
  updatedAt: string;
  budgetText: string;
  campaignRef: string;
  currencyText: string;
  countryText: string;
  floorValue: string;
  reviewer: string;
  thresholdText: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    updatedAt: string,
    budgetText: string,
    campaignRef: string,
    currencyText: string,
    countryText: string,
    floorValue: string,
    reviewer: string,
    thresholdText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.updatedAt = updatedAt;
    this.budgetText = budgetText;
    this.campaignRef = campaignRef;
    this.currencyText = currencyText;
    this.countryText = countryText;
    this.floorValue = floorValue;
    this.reviewer = reviewer;
    this.thresholdText = thresholdText;
    this.statusLabel = statusLabel;
  }
}

export function toFunnelAssignmentView(item: FunnelAssignment): FunnelAssignmentView {
  return new FunnelAssignmentView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 120),
    String(item.updatedAt),
    item.budget.toFixed(2),
    text.truncate(item.campaignRef, 80),
    item.currency,
    text.truncate(item.country, 40),
    item.floorValue.toFixed(2),
    item.reviewer,
    item.threshold.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFunnelAssignmentViews(items: FunnelAssignment[]): FunnelAssignmentView[] {
  const views: FunnelAssignmentView[] = [];
  for (const item of items) {
    views.push(toFunnelAssignmentView(item));
  }
  return views;
}

export function sumFunnelAssignmentView(view: FunnelAssignmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedFloorValue = Number(view.floorValue);
  if (Number.isNaN(parsedFloorValue)) throw new Error(`parse floor value: ${view.floorValue} is not a number`);
  return parsedUpdatedAt + parsedBudget + parsedFloorValue;
}
