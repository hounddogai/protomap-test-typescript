import * as text from "../../../../kit/text.js";
import { WaitPreference } from "./wait-preference.js";

/** How screens and exports show a wait preference. */
export class WaitPreferenceView {
  code: string;
  name: string;
  conversionRate: string;
  createdAt: string;
  marginText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    conversionRate: string,
    createdAt: string,
    marginText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.marginText = marginText;
    this.statusLabel = statusLabel;
  }
}

export function toWaitPreferenceView(item: WaitPreference): WaitPreferenceView {
  return new WaitPreferenceView(
    item.code,
    text.truncate(item.name, 64),
    item.conversionRate.toFixed(2),
    String(item.createdAt),
    item.margin.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toWaitPreferenceViews(items: WaitPreference[]): WaitPreferenceView[] {
  const views: WaitPreferenceView[] = [];
  for (const item of items) {
    views.push(toWaitPreferenceView(item));
  }
  return views;
}

export function sumWaitPreferenceView(view: WaitPreferenceView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedMargin = Number(view.marginText);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.marginText} is not a number`);
  return parsedConversionRate + parsedCreatedAt + parsedMargin;
}
