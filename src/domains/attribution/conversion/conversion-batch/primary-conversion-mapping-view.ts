import * as text from "../../../../kit/text.js";
import { PrimaryConversionMapping } from "./primary-conversion-mapping.js";

/** How screens and exports show a primary conversion mapping. */
export class PrimaryConversionMappingView {
  code: string;
  label: string;
  notes: string;
  windowDaysText: string;
  locale: string;
  activeText: string;
  region: string;
  utmSourceText: string;
  reviewer: string;
  expiresAt: string;
  category: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    notes: string,
    windowDaysText: string,
    locale: string,
    activeText: string,
    region: string,
    utmSourceText: string,
    reviewer: string,
    expiresAt: string,
    category: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.windowDaysText = windowDaysText;
    this.locale = locale;
    this.activeText = activeText;
    this.region = region;
    this.utmSourceText = utmSourceText;
    this.reviewer = reviewer;
    this.expiresAt = expiresAt;
    this.category = category;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryConversionMappingView(item: PrimaryConversionMapping): PrimaryConversionMappingView {
  return new PrimaryConversionMappingView(
    text.truncate(item.code, 64),
    item.label,
    text.truncate(item.notes, 120),
    String(item.windowDays),
    text.truncate(item.locale, 120),
    `${item.active}`,
    text.truncate(item.region, 40),
    text.truncate(item.utmSource, 40),
    item.reviewer,
    String(item.expiresAt),
    text.truncate(item.category, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryConversionMappingViews(items: PrimaryConversionMapping[]): PrimaryConversionMappingView[] {
  const views: PrimaryConversionMappingView[] = [];
  for (const item of items) {
    views.push(toPrimaryConversionMappingView(item));
  }
  return views;
}

export function sumPrimaryConversionMappingView(view: PrimaryConversionMappingView): number {
  const parsedWindowDays = Number(view.windowDaysText);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDaysText} is not a number`);
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  return parsedWindowDays + parsedExpiresAt;
}
