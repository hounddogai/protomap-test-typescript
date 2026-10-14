import * as text from "../../../../kit/text.js";
import { ComplaintEntry } from "./complaint-entry.js";

/** How screens and exports show a complaint entry. */
export class ComplaintEntryView {
  code: string;
  label: string;
  visible: string;
  priority: string;
  retriesText: string;
  amount: string;
  approved: string;
  contactEmailText: string;
  audienceId: string;
  capacity: string;
  unit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    visible: string,
    priority: string,
    retriesText: string,
    amount: string,
    approved: string,
    contactEmailText: string,
    audienceId: string,
    capacity: string,
    unit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.priority = priority;
    this.retriesText = retriesText;
    this.amount = amount;
    this.approved = approved;
    this.contactEmailText = contactEmailText;
    this.audienceId = audienceId;
    this.capacity = capacity;
    this.unit = unit;
    this.statusLabel = statusLabel;
  }
}

export function toComplaintEntryView(item: ComplaintEntry): ComplaintEntryView {
  return new ComplaintEntryView(
    text.truncate(item.code, 40),
    item.label,
    `${item.visible}`,
    String(item.priority),
    String(item.retries),
    item.amount.toFixed(2),
    `${item.approved}`,
    text.truncate(item.contactEmail, 80),
    text.truncate(item.audienceId, 120),
    String(item.capacity),
    item.unit,
    `${item.status}`.toUpperCase(),
  );
}

export function toComplaintEntryViews(items: ComplaintEntry[]): ComplaintEntryView[] {
  const views: ComplaintEntryView[] = [];
  for (const item of items) {
    views.push(toComplaintEntryView(item));
  }
  return views;
}

export function sumComplaintEntryView(view: ComplaintEntryView): number {
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  return parsedPriority + parsedRetries + parsedAmount;
}
