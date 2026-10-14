import * as text from "../../../../kit/text.js";
import { QueueMilestone } from "./queue-milestone.js";

/** How screens and exports show a queue milestone. */
export class QueueMilestoneView {
  codeText: string;
  name: string;
  notes: string;
  ownerIdText: string;
  amount: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    notes: string,
    ownerIdText: string,
    amount: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.notes = notes;
    this.ownerIdText = ownerIdText;
    this.amount = amount;
    this.statusLabel = statusLabel;
  }
}

export function toQueueMilestoneView(item: QueueMilestone): QueueMilestoneView {
  return new QueueMilestoneView(
    text.truncate(item.code, 40),
    item.name,
    text.truncate(item.notes, 80),
    item.ownerId,
    item.amount.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toQueueMilestoneViews(items: QueueMilestone[]): QueueMilestoneView[] {
  const views: QueueMilestoneView[] = [];
  for (const item of items) {
    views.push(toQueueMilestoneView(item));
  }
  return views;
}

export function sumQueueMilestoneView(view: QueueMilestoneView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedAmount;
}
