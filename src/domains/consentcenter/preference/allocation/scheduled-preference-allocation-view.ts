import * as text from "../../../../kit/text.js";
import { ScheduledPreferenceAllocation } from "./scheduled-preference-allocation.js";

/** How screens and exports show a scheduled preference allocation. */
export class ScheduledPreferenceAllocationView {
  code: string;
  title: string;
  archivedText: string;
  summary: string;
  channel: string;
  contactEmail: string;
  amountText: string;
  attempts: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archivedText: string,
    summary: string,
    channel: string,
    contactEmail: string,
    amountText: string,
    attempts: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archivedText = archivedText;
    this.summary = summary;
    this.channel = channel;
    this.contactEmail = contactEmail;
    this.amountText = amountText;
    this.attempts = attempts;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledPreferenceAllocationView(item: ScheduledPreferenceAllocation): ScheduledPreferenceAllocationView {
  return new ScheduledPreferenceAllocationView(
    text.truncate(item.code, 64),
    text.truncate(item.title, 80),
    `${item.archived}`,
    item.summary,
    item.channel,
    item.contactEmail,
    item.amount.toFixed(2),
    String(item.attempts),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledPreferenceAllocationViews(items: ScheduledPreferenceAllocation[]): ScheduledPreferenceAllocationView[] {
  const views: ScheduledPreferenceAllocationView[] = [];
  for (const item of items) {
    views.push(toScheduledPreferenceAllocationView(item));
  }
  return views;
}

export function sumScheduledPreferenceAllocationView(view: ScheduledPreferenceAllocationView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  return parsedAmount + parsedAttempts;
}
