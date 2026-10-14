import * as text from "../../../../kit/text.js";
import { SlaMilestone } from "./sla-milestone.js";

/** How screens and exports show a sla milestone. */
export class SlaMilestoneView {
  codeText: string;
  nameText: string;
  clicks: string;
  margin: string;
  budget: string;
  externalRef: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    clicks: string,
    margin: string,
    budget: string,
    externalRef: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.clicks = clicks;
    this.margin = margin;
    this.budget = budget;
    this.externalRef = externalRef;
    this.statusLabel = statusLabel;
  }
}

export function toSlaMilestoneView(item: SlaMilestone): SlaMilestoneView {
  return new SlaMilestoneView(
    text.truncate(item.code, 80),
    text.truncate(item.name, 64),
    String(item.clicks),
    item.margin.toFixed(2),
    item.budget.toFixed(2),
    item.externalRef,
    `${item.status}`.toUpperCase(),
  );
}

export function toSlaMilestoneViews(items: SlaMilestone[]): SlaMilestoneView[] {
  const views: SlaMilestoneView[] = [];
  for (const item of items) {
    views.push(toSlaMilestoneView(item));
  }
  return views;
}

export function sumSlaMilestoneView(view: SlaMilestoneView): number {
  const parsedClicks = Number(view.clicks);
  if (Number.isNaN(parsedClicks)) throw new Error(`parse clicks: ${view.clicks} is not a number`);
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedClicks + parsedMargin + parsedBudget;
}
