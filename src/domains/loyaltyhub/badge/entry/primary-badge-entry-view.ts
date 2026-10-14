import * as text from "../../../../kit/text.js";
import { PrimaryBadgeEntry } from "./primary-badge-entry.js";

/** How screens and exports show a primary badge entry. */
export class PrimaryBadgeEntryView {
  codeText: string;
  labelText: string;
  reviewer: string;
  windowDays: string;
  approved: string;
  budgetText: string;
  limitText: string;
  localeText: string;
  audienceIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    reviewer: string,
    windowDays: string,
    approved: string,
    budgetText: string,
    limitText: string,
    localeText: string,
    audienceIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.reviewer = reviewer;
    this.windowDays = windowDays;
    this.approved = approved;
    this.budgetText = budgetText;
    this.limitText = limitText;
    this.localeText = localeText;
    this.audienceIdText = audienceIdText;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBadgeEntryView(item: PrimaryBadgeEntry): PrimaryBadgeEntryView {
  return new PrimaryBadgeEntryView(
    item.code,
    item.label,
    item.reviewer,
    String(item.windowDays),
    `${item.approved}`,
    item.budget.toFixed(2),
    String(item.limit),
    text.truncate(item.locale, 40),
    item.audienceId,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBadgeEntryViews(items: PrimaryBadgeEntry[]): PrimaryBadgeEntryView[] {
  const views: PrimaryBadgeEntryView[] = [];
  for (const item of items) {
    views.push(toPrimaryBadgeEntryView(item));
  }
  return views;
}

export function sumPrimaryBadgeEntryView(view: PrimaryBadgeEntryView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  return parsedWindowDays + parsedBudget + parsedLimit;
}
