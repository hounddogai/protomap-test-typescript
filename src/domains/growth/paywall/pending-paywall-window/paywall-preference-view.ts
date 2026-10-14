import * as text from "../../../../kit/text.js";
import { PaywallPreference } from "./paywall-preference.js";

/** How screens and exports show a paywall preference. */
export class PaywallPreferenceView {
  codeText: string;
  title: string;
  locale: string;
  budget: string;
  retries: string;
  unit: string;
  utmSource: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    locale: string,
    budget: string,
    retries: string,
    unit: string,
    utmSource: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.locale = locale;
    this.budget = budget;
    this.retries = retries;
    this.unit = unit;
    this.utmSource = utmSource;
    this.statusLabel = statusLabel;
  }
}

export function toPaywallPreferenceView(item: PaywallPreference): PaywallPreferenceView {
  return new PaywallPreferenceView(
    item.code,
    text.truncate(item.title, 40),
    item.locale,
    item.budget.toFixed(2),
    String(item.retries),
    text.truncate(item.unit, 40),
    text.truncate(item.utmSource, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPaywallPreferenceViews(items: PaywallPreference[]): PaywallPreferenceView[] {
  const views: PaywallPreferenceView[] = [];
  for (const item of items) {
    views.push(toPaywallPreferenceView(item));
  }
  return views;
}

export function sumPaywallPreferenceView(view: PaywallPreferenceView): number {
  const parsedBudget = Number(view.budget);
  if (Number.isNaN(parsedBudget)) throw new Error(`parse budget: ${view.budget} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  return parsedBudget + parsedRetries;
}
