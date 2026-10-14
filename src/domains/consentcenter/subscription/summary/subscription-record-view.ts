import * as text from "../../../../kit/text.js";
import { SubscriptionRecord } from "./subscription-record.js";

/** How screens and exports show a subscription record. */
export class SubscriptionRecordView {
  code: string;
  labelText: string;
  active: string;
  minimumText: string;
  sendAt: string;
  budget: string;
  attempts: string;
  limit: string;
  description: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    active: string,
    minimumText: string,
    sendAt: string,
    budget: string,
    attempts: string,
    limit: string,
    description: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.active = active;
    this.minimumText = minimumText;
    this.sendAt = sendAt;
    this.budget = budget;
    this.attempts = attempts;
    this.limit = limit;
    this.description = description;
    this.statusLabel = statusLabel;
  }
}

export function toSubscriptionRecordView(item: SubscriptionRecord): SubscriptionRecordView {
  return new SubscriptionRecordView(
    text.truncate(item.code, 80),
    item.label,
    `${item.active}`,
    item.minimum.toFixed(2),
    String(item.sendAt),
    item.budget.toFixed(2),
    String(item.attempts),
    String(item.limit),
    item.description,
    `${item.status}`.toUpperCase(),
  );
}

export function toSubscriptionRecordViews(items: SubscriptionRecord[]): SubscriptionRecordView[] {
  const views: SubscriptionRecordView[] = [];
  for (const item of items) {
    views.push(toSubscriptionRecordView(item));
  }
  return views;
}

export function sumSubscriptionRecordView(view: SubscriptionRecordView): number {
  const parsedMinimum = Number(view.minimumText);
  if (Number.isNaN(parsedMinimum)) throw new Error(`parse minimum: ${view.minimumText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  return parsedMinimum + parsedSendAt + parsedBudget;
}
