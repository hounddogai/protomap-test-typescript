import * as text from "../../../../kit/text.js";
import { TieredWindowPreference } from "./tiered-window-preference.js";

/** How screens and exports show a tiered window preference. */
export class TieredWindowPreferenceView {
  code: string;
  label: string;
  active: string;
  reviewerText: string;
  budgetText: string;
  startsAtText: string;
  checksum: string;
  limit: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    active: string,
    reviewerText: string,
    budgetText: string,
    startsAtText: string,
    checksum: string,
    limit: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.reviewerText = reviewerText;
    this.budgetText = budgetText;
    this.startsAtText = startsAtText;
    this.checksum = checksum;
    this.limit = limit;
    this.statusLabel = statusLabel;
  }
}

export function toTieredWindowPreferenceView(item: TieredWindowPreference): TieredWindowPreferenceView {
  return new TieredWindowPreferenceView(
    item.code,
    item.label,
    `${item.active}`,
    text.truncate(item.reviewer, 120),
    item.budget.toFixed(2),
    String(item.startsAt),
    text.truncate(item.checksum, 120),
    String(item.limit),
    `${item.status}`.toUpperCase(),
  );
}

export function toTieredWindowPreferenceViews(items: TieredWindowPreference[]): TieredWindowPreferenceView[] {
  const views: TieredWindowPreferenceView[] = [];
  for (const item of items) {
    views.push(toTieredWindowPreferenceView(item));
  }
  return views;
}

export function sumTieredWindowPreferenceView(view: TieredWindowPreferenceView): number {
  const parsedBudget = Number(view.budgetText);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budgetText} is not a number`);
  const parsedStartsAt = Number(view.startsAtText);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAtText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  return parsedBudget + parsedStartsAt + parsedLimit;
}
