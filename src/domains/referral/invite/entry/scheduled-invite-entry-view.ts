import * as text from "../../../../kit/text.js";
import { ScheduledInviteEntry } from "./scheduled-invite-entry.js";

/** How screens and exports show a scheduled invite entry. */
export class ScheduledInviteEntryView {
  codeText: string;
  labelText: string;
  budget: string;
  externalRef: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    budget: string,
    externalRef: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.budget = budget;
    this.externalRef = externalRef;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toScheduledInviteEntryView(item: ScheduledInviteEntry): ScheduledInviteEntryView {
  return new ScheduledInviteEntryView(
    text.truncate(item.code, 40),
    item.label,
    item.budget.toFixed(2),
    item.externalRef,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toScheduledInviteEntryViews(items: ScheduledInviteEntry[]): ScheduledInviteEntryView[] {
  const views: ScheduledInviteEntryView[] = [];
  for (const item of items) {
    views.push(toScheduledInviteEntryView(item));
  }
  return views;
}

export function sumScheduledInviteEntryView(view: ScheduledInviteEntryView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedBudget + parsedConversionRate;
}
