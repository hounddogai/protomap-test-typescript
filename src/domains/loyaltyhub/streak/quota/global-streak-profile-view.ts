import * as text from "../../../../kit/text.js";
import { GlobalStreakProfile } from "./global-streak-profile.js";

/** How screens and exports show a global streak profile. */
export class GlobalStreakProfileView {
  codeText: string;
  label: string;
  currencyText: string;
  phone: string;
  attemptsText: string;
  country: string;
  reviewer: string;
  titleText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    currencyText: string,
    phone: string,
    attemptsText: string,
    country: string,
    reviewer: string,
    titleText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.currencyText = currencyText;
    this.phone = phone;
    this.attemptsText = attemptsText;
    this.country = country;
    this.reviewer = reviewer;
    this.titleText = titleText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalStreakProfileView(item: GlobalStreakProfile): GlobalStreakProfileView {
  return new GlobalStreakProfileView(
    text.truncate(item.code, 40),
    text.truncate(item.label, 64),
    text.truncate(item.currency, 40),
    text.truncate(item.phone, 64),
    String(item.attempts),
    item.country,
    item.reviewer,
    item.title,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalStreakProfileViews(items: GlobalStreakProfile[]): GlobalStreakProfileView[] {
  const views: GlobalStreakProfileView[] = [];
  for (const item of items) {
    views.push(toGlobalStreakProfileView(item));
  }
  return views;
}

export function sumGlobalStreakProfileView(view: GlobalStreakProfileView): number {
  const parsedAttempts = Number(view.attemptsText);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attemptsText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAttempts + parsedConversionRate;
}
