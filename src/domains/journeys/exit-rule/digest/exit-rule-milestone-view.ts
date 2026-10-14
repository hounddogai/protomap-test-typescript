import * as text from "../../../../kit/text.js";
import { ExitRuleMilestone } from "./exit-rule-milestone.js";

/** How screens and exports show a exit rule milestone. */
export class ExitRuleMilestoneView {
  codeText: string;
  label: string;
  visible: string;
  source: string;
  nameText: string;
  ownerIdText: string;
  rateText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    visible: string,
    source: string,
    nameText: string,
    ownerIdText: string,
    rateText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.visible = visible;
    this.source = source;
    this.nameText = nameText;
    this.ownerIdText = ownerIdText;
    this.rateText = rateText;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleMilestoneView(item: ExitRuleMilestone): ExitRuleMilestoneView {
  return new ExitRuleMilestoneView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 80),
    `${item.visible}`,
    item.source,
    item.name,
    text.truncate(item.ownerId, 40),
    item.rate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleMilestoneViews(items: ExitRuleMilestone[]): ExitRuleMilestoneView[] {
  const views: ExitRuleMilestoneView[] = [];
  for (const item of items) {
    views.push(toExitRuleMilestoneView(item));
  }
  return views;
}

export function sumExitRuleMilestoneView(view: ExitRuleMilestoneView): number {
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  return parsedRate;
}
