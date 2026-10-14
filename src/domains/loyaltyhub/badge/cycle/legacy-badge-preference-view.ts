import * as text from "../../../../kit/text.js";
import { LegacyBadgePreference } from "./legacy-badge-preference.js";

/** How screens and exports show a legacy badge preference. */
export class LegacyBadgePreferenceView {
  code: string;
  name: string;
  margin: string;
  variant: string;
  amount: string;
  priority: string;
  durationMinutes: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    margin: string,
    variant: string,
    amount: string,
    priority: string,
    durationMinutes: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.margin = margin;
    this.variant = variant;
    this.amount = amount;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyBadgePreferenceView(item: LegacyBadgePreference): LegacyBadgePreferenceView {
  return new LegacyBadgePreferenceView(
    item.code,
    text.truncate(item.name, 40),
    item.margin.toFixed(2),
    text.truncate(item.variant, 64),
    item.amount.toFixed(2),
    String(item.priority),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyBadgePreferenceViews(items: LegacyBadgePreference[]): LegacyBadgePreferenceView[] {
  const views: LegacyBadgePreferenceView[] = [];
  for (const item of items) {
    views.push(toLegacyBadgePreferenceView(item));
  }
  return views;
}

export function sumLegacyBadgePreferenceView(view: LegacyBadgePreferenceView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedPriority = Number(view.priority);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priority} is not a number`);
  return parsedMargin + parsedAmount + parsedPriority;
}
