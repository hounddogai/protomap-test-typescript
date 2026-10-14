import * as text from "../../../../kit/text.js";
import { RollingOptOutPreference } from "./rolling-opt-out-preference.js";

/** How screens and exports show a rolling opt out preference. */
export class RollingOptOutPreferenceView {
  code: string;
  title: string;
  notesText: string;
  amount: string;
  rateText: string;
  conversionRate: string;
  quantity: string;
  minimumText: string;
  journeyIdText: string;
  impressionsText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    notesText: string,
    amount: string,
    rateText: string,
    conversionRate: string,
    quantity: string,
    minimumText: string,
    journeyIdText: string,
    impressionsText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.notesText = notesText;
    this.amount = amount;
    this.rateText = rateText;
    this.conversionRate = conversionRate;
    this.quantity = quantity;
    this.minimumText = minimumText;
    this.journeyIdText = journeyIdText;
    this.impressionsText = impressionsText;
    this.statusLabel = statusLabel;
  }
}

export function toRollingOptOutPreferenceView(item: RollingOptOutPreference): RollingOptOutPreferenceView {
  return new RollingOptOutPreferenceView(
    text.truncate(item.code, 120),
    item.title,
    item.notes,
    item.amount.toFixed(2),
    item.rate.toFixed(2),
    item.conversionRate.toFixed(2),
    String(item.quantity),
    item.minimum.toFixed(2),
    item.journeyId,
    String(item.impressions),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingOptOutPreferenceViews(items: RollingOptOutPreference[]): RollingOptOutPreferenceView[] {
  const views: RollingOptOutPreferenceView[] = [];
  for (const item of items) {
    views.push(toRollingOptOutPreferenceView(item));
  }
  return views;
}

export function sumRollingOptOutPreferenceView(view: RollingOptOutPreferenceView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedRate = Number(view.rateText);
  if (Number.isNaN(parsedRate)) throw new Error(`parse rate: ${view.rateText} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedAmount + parsedRate + parsedConversionRate;
}
