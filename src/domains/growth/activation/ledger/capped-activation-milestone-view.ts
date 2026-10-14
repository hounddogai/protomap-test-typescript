import * as text from "../../../../kit/text.js";
import { CappedActivationMilestone } from "./capped-activation-milestone.js";

/** How screens and exports show a capped activation milestone. */
export class CappedActivationMilestoneView {
  code: string;
  label: string;
  notesText: string;
  costText: string;
  channel: string;
  limitText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notesText: string,
    costText: string,
    channel: string,
    limitText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notesText = notesText;
    this.costText = costText;
    this.channel = channel;
    this.limitText = limitText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedActivationMilestoneView(item: CappedActivationMilestone): CappedActivationMilestoneView {
  return new CappedActivationMilestoneView(
    item.code,
    text.truncate(item.label, 80),
    item.notes,
    item.cost.toFixed(2),
    item.channel,
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedActivationMilestoneViews(items: CappedActivationMilestone[]): CappedActivationMilestoneView[] {
  const views: CappedActivationMilestoneView[] = [];
  for (const item of items) {
    views.push(toCappedActivationMilestoneView(item));
  }
  return views;
}

export function sumCappedActivationMilestoneView(view: CappedActivationMilestoneView): number {
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedCost + parsedLimit;
}
