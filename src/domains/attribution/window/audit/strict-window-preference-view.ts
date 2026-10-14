import * as text from "../../../../kit/text.js";
import { StrictWindowPreference } from "./strict-window-preference.js";

/** How screens and exports show a strict window preference. */
export class StrictWindowPreferenceView {
  code: string;
  title: string;
  archived: string;
  audienceIdText: string;
  approvedText: string;
  conversionRate: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    archived: string,
    audienceIdText: string,
    approvedText: string,
    conversionRate: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.audienceIdText = audienceIdText;
    this.approvedText = approvedText;
    this.conversionRate = conversionRate;
    this.statusLabel = statusLabel;
  }
}

export function toStrictWindowPreferenceView(item: StrictWindowPreference): StrictWindowPreferenceView {
  return new StrictWindowPreferenceView(
    item.code,
    item.title,
    `${item.archived}`,
    text.truncate(item.audienceId, 40),
    `${item.approved}`,
    item.conversionRate.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictWindowPreferenceViews(items: StrictWindowPreference[]): StrictWindowPreferenceView[] {
  const views: StrictWindowPreferenceView[] = [];
  for (const item of items) {
    views.push(toStrictWindowPreferenceView(item));
  }
  return views;
}

export function sumStrictWindowPreferenceView(view: StrictWindowPreferenceView): number {
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedConversionRate;
}
