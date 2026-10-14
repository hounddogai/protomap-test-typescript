import * as text from "../../../../kit/text.js";
import { ManualBadgeMilestone } from "./manual-badge-milestone.js";

/** How screens and exports show a manual badge milestone. */
export class ManualBadgeMilestoneView {
  code: string;
  name: string;
  currency: string;
  active: string;
  priorityText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    currency: string,
    active: string,
    priorityText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.active = active;
    this.priorityText = priorityText;
    this.statusLabel = statusLabel;
  }
}

export function toManualBadgeMilestoneView(item: ManualBadgeMilestone): ManualBadgeMilestoneView {
  return new ManualBadgeMilestoneView(
    item.code,
    text.truncate(item.name, 40),
    item.currency,
    `${item.active}`,
    String(item.priority),
    `${item.status}`.toUpperCase(),
  );
}

export function toManualBadgeMilestoneViews(items: ManualBadgeMilestone[]): ManualBadgeMilestoneView[] {
  const views: ManualBadgeMilestoneView[] = [];
  for (const item of items) {
    views.push(toManualBadgeMilestoneView(item));
  }
  return views;
}

export function sumManualBadgeMilestoneView(view: ManualBadgeMilestoneView): number {
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedPriority;
}
