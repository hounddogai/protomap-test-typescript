import * as text from "../../../../kit/text.js";
import { RetentionPreference } from "./retention-preference.js";

/** How screens and exports show a retention preference. */
export class RetentionPreferenceView {
  codeText: string;
  name: string;
  unitText: string;
  regionText: string;
  budget: string;
  updatedAt: string;
  windowDaysText: string;
  title: string;
  countryText: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    unitText: string,
    regionText: string,
    budget: string,
    updatedAt: string,
    windowDaysText: string,
    title: string,
    countryText: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.unitText = unitText;
    this.regionText = regionText;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.windowDaysText = windowDaysText;
    this.title = title;
    this.countryText = countryText;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toRetentionPreferenceView(item: RetentionPreference): RetentionPreferenceView {
  return new RetentionPreferenceView(
    item.code,
    item.name,
    item.unit,
    text.truncate(item.region, 80),
    item.budget.toFixed(2),
    String(item.updatedAt),
    String(item.windowDays),
    item.title,
    item.country,
    item.ownerId,
    `${item.status}`.toUpperCase(),
  );
}

export function toRetentionPreferenceViews(items: RetentionPreference[]): RetentionPreferenceView[] {
  const views: RetentionPreferenceView[] = [];
  for (const item of items) {
    views.push(toRetentionPreferenceView(item));
  }
  return views;
}

export function sumRetentionPreferenceView(view: RetentionPreferenceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  return parsedBudget + parsedUpdatedAt + parsedWindowDays;
}
