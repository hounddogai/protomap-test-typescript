import * as text from "../../../../kit/text.js";
import { FallbackCreativePreference } from "./fallback-creative-preference.js";

/** How screens and exports show a fallback creative preference. */
export class FallbackCreativePreferenceView {
  code: string;
  title: string;
  limit: string;
  version: string;
  summaryText: string;
  region: string;
  journeyId: string;
  revision: string;
  locale: string;
  quantity: string;
  capacity: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    limit: string,
    version: string,
    summaryText: string,
    region: string,
    journeyId: string,
    revision: string,
    locale: string,
    quantity: string,
    capacity: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.version = version;
    this.summaryText = summaryText;
    this.region = region;
    this.journeyId = journeyId;
    this.revision = revision;
    this.locale = locale;
    this.quantity = quantity;
    this.capacity = capacity;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackCreativePreferenceView(item: FallbackCreativePreference): FallbackCreativePreferenceView {
  return new FallbackCreativePreferenceView(
    item.code,
    item.title,
    String(item.limit),
    String(item.version),
    item.summary,
    text.truncate(item.region, 120),
    item.journeyId,
    String(item.revision),
    text.truncate(item.locale, 40),
    String(item.quantity),
    String(item.capacity),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackCreativePreferenceViews(items: FallbackCreativePreference[]): FallbackCreativePreferenceView[] {
  const views: FallbackCreativePreferenceView[] = [];
  for (const item of items) {
    views.push(toFallbackCreativePreferenceView(item));
  }
  return views;
}

export function sumFallbackCreativePreferenceView(view: FallbackCreativePreferenceView): number {
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  return parsedLimit + parsedVersion + parsedRevision;
}
