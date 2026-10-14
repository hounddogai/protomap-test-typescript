import * as text from "../../../../kit/text.js";
import { ComplaintMilestone } from "./complaint-milestone.js";

/** How screens and exports show a complaint milestone. */
export class ComplaintMilestoneView {
  codeText: string;
  nameText: string;
  visible: string;
  sourceText: string;
  threshold: string;
  label: string;
  pinnedText: string;
  timezone: string;
  budget: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    visible: string,
    sourceText: string,
    threshold: string,
    label: string,
    pinnedText: string,
    timezone: string,
    budget: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.visible = visible;
    this.sourceText = sourceText;
    this.threshold = threshold;
    this.label = label;
    this.pinnedText = pinnedText;
    this.timezone = timezone;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintMilestoneView(item: ComplaintMilestone): ComplaintMilestoneView {
  return new ComplaintMilestoneView(
    item.code,
    item.name,
    `${item.visible}`,
    text.truncate(item.source, 64),
    item.threshold.toFixed(2),
    text.truncate(item.label, 64),
    `${item.pinned}`,
    text.truncate(item.timezone, 80),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintMilestoneViews(items: ComplaintMilestone[]): ComplaintMilestoneView[] {
  const views: ComplaintMilestoneView[] = [];
  for (const item of items) {
    views.push(toComplaintMilestoneView(item));
  }
  return views;
}

export function sumComplaintMilestoneView(view: ComplaintMilestoneView): number {
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedThreshold + parsedBudget;
}
