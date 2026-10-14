import * as text from "../../../../kit/text.js";
import { FallbackSlaTier } from "./fallback-sla-tier.js";

/** How screens and exports show a fallback sla tier. */
export class FallbackSlaTierView {
  codeText: string;
  name: string;
  phoneText: string;
  locale: string;
  impressions: string;
  graceDays: string;
  timezoneText: string;
  source: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    phoneText: string,
    locale: string,
    impressions: string,
    graceDays: string,
    timezoneText: string,
    source: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.phoneText = phoneText;
    this.locale = locale;
    this.impressions = impressions;
    this.graceDays = graceDays;
    this.timezoneText = timezoneText;
    this.source = source;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSlaTierView(item: FallbackSlaTier): FallbackSlaTierView {
  return new FallbackSlaTierView(
    item.code,
    item.name,
    item.phone,
    item.locale,
    String(item.impressions),
    String(item.graceDays),
    text.truncate(item.timezone, 40),
    text.truncate(item.source, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSlaTierViews(items: FallbackSlaTier[]): FallbackSlaTierView[] {
  const views: FallbackSlaTierView[] = [];
  for (const item of items) {
    views.push(toFallbackSlaTierView(item));
  }
  return views;
}

export function sumFallbackSlaTierView(view: FallbackSlaTierView): number {
  const parsedImpressions = Number(view.impressions);
  if (Number.isNaN(parsedImpressions)) throw new Error(`parse impressions: ${view.impressions} is not a number`);
  const parsedGraceDays = Number(view.graceDays);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDays} is not a number`);
  return parsedImpressions + parsedGraceDays;
}
