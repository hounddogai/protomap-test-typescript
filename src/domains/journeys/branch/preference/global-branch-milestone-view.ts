import * as text from "../../../../kit/text.js";
import { GlobalBranchMilestone } from "./global-branch-milestone.js";

/** How screens and exports show a global branch milestone. */
export class GlobalBranchMilestoneView {
  code: string;
  label: string;
  visibleText: string;
  amount: string;
  campaignRef: string;
  impressionsText: string;
  title: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visibleText: string,
    amount: string,
    campaignRef: string,
    impressionsText: string,
    title: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visibleText = visibleText;
    this.amount = amount;
    this.campaignRef = campaignRef;
    this.impressionsText = impressionsText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalBranchMilestoneView(item: GlobalBranchMilestone): GlobalBranchMilestoneView {
  return new GlobalBranchMilestoneView(
    text.truncate(item.code, 120),
    text.truncate(item.label, 80),
    `${item.visible}`,
    item.amount.toFixed(2),
    item.campaignRef,
    String(item.impressions),
    text.truncate(item.title, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalBranchMilestoneViews(items: GlobalBranchMilestone[]): GlobalBranchMilestoneView[] {
  const views: GlobalBranchMilestoneView[] = [];
  for (const item of items) {
    views.push(toGlobalBranchMilestoneView(item));
  }
  return views;
}

export function sumGlobalBranchMilestoneView(view: GlobalBranchMilestoneView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedImpressions = Number(view.impressionsText);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressionsText} is not a number`);
  return parsedAmount + parsedImpressions;
}
