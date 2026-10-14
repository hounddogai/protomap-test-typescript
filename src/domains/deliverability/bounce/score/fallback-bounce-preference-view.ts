import { FallbackBouncePreference } from "./fallback-bounce-preference.js";

/** How screens and exports show a fallback bounce preference. */
export class FallbackBouncePreferenceView {
  code: string;
  label: string;
  attempts: string;
  openRate: string;
  capacity: string;
  graceDays: string;
  expiresAt: string;
  budgetText: string;
  currency: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    attempts: string,
    openRate: string,
    capacity: string,
    graceDays: string,
    expiresAt: string,
    budgetText: string,
    currency: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.attempts = attempts;
    this.openRate = openRate;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.budgetText = budgetText;
    this.currency = currency;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackBouncePreferenceView(item: FallbackBouncePreference): FallbackBouncePreferenceView {
  return new FallbackBouncePreferenceView(
    item.code,
    item.label,
    String(item.attempts),
    item.openRate.toFixed(2),
    String(item.capacity),
    String(item.graceDays),
    String(item.expiresAt),
    item.budget.toFixed(2),
    item.currency,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackBouncePreferenceViews(items: FallbackBouncePreference[]): FallbackBouncePreferenceView[] {
  const views: FallbackBouncePreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackBouncePreferenceView(item));
  }
  return views;
}

export function sumFallbackBouncePreferenceView(view: FallbackBouncePreferenceView): number {
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedAttempts + parsedOpenRate + parsedCapacity;
}
