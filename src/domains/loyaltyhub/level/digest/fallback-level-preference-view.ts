import * as text from "../../../../kit/text.js";
import { FallbackLevelPreference } from "./fallback-level-preference.js";

/** How screens and exports show a fallback level preference. */
export class FallbackLevelPreferenceView {
  code: string;
  label: string;
  category: string;
  locale: string;
  windowDays: string;
  expiresAt: string;
  priorityText: string;
  graceDays: string;
  conversionRateText: string;
  ownerId: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    windowDays: string,
    expiresAt: string,
    priorityText: string,
    graceDays: string,
    conversionRateText: string,
    ownerId: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.priorityText = priorityText;
    this.graceDays = graceDays;
    this.conversionRateText = conversionRateText;
    this.ownerId = ownerId;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackLevelPreferenceView(item: FallbackLevelPreference): FallbackLevelPreferenceView {
  return new FallbackLevelPreferenceView(
    text.truncate(item.code, 80),
    text.truncate(item.label, 120),
    item.category,
    item.locale,
    String(item.windowDays),
    String(item.expiresAt),
    String(item.priority),
    String(item.graceDays),
    item.conversionRate.toFixed(2),
    text.truncate(item.ownerId, 120),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackLevelPreferenceViews(items: FallbackLevelPreference[]): FallbackLevelPreferenceView[] {
  const views: FallbackLevelPreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackLevelPreferenceView(item));
  }
  return views;
}

export function sumFallbackLevelPreferenceView(view: FallbackLevelPreferenceView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedWindowDays + parsedExpiresAt + parsedPriority;
}
