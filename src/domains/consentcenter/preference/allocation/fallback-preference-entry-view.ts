import * as text from "../../../../kit/text.js";
import { FallbackPreferenceEntry } from "./fallback-preference-entry.js";

/** How screens and exports show a fallback preference entry. */
export class FallbackPreferenceEntryView {
  code: string;
  titleText: string;
  openRate: string;
  timezone: string;
  endsAtText: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    openRate: string,
    timezone: string,
    endsAtText: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.openRate = openRate;
    this.timezone = timezone;
    this.endsAtText = endsAtText;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPreferenceEntryView(item: FallbackPreferenceEntry): FallbackPreferenceEntryView {
  return new FallbackPreferenceEntryView(
    item.code,
    text.truncate(item.title, 80),
    item.openRate.toFixed(2),
    text.truncate(item.timezone, 40),
    String(item.endsAt),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPreferenceEntryViews(items: FallbackPreferenceEntry[]): FallbackPreferenceEntryView[] {
  const views: FallbackPreferenceEntryView[] = [];
  for (const item of items) {
    views.push(toFallbackPreferenceEntryView(item));
  }
  return views;
}

export function sumFallbackPreferenceEntryView(view: FallbackPreferenceEntryView): number {
  const parsedOpenRate = Number(view.openRate);
  if (Number.isNaN(parsedOpenRate)) throw new Error(`parse open rate: ${view.openRate} is not a number`);
  const parsedEndsAt = Number(view.endsAtText);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAtText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedOpenRate + parsedEndsAt + parsedExpiresAt;
}
