import * as text from "../../../../kit/text.js";
import { FallbackSuppressionGroup } from "./fallback-suppression-group.js";

/** How screens and exports show a fallback suppression group. */
export class FallbackSuppressionGroupView {
  codeText: string;
  label: string;
  locale: string;
  amountText: string;
  limit: string;
  capacity: string;
  durationMinutes: string;
  contactEmail: string;
  summary: string;
  region: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    locale: string,
    amountText: string,
    limit: string,
    capacity: string,
    durationMinutes: string,
    contactEmail: string,
    summary: string,
    region: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.locale = locale;
    this.amountText = amountText;
    this.limit = limit;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.summary = summary;
    this.region = region;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackSuppressionGroupView(item: FallbackSuppressionGroup): FallbackSuppressionGroupView {
  return new FallbackSuppressionGroupView(
    item.code,
    item.label,
    item.locale,
    item.amount.toFixed(2),
    String(item.limit),
    String(item.capacity),
    String(item.durationMinutes),
    text.truncate(item.contactEmail, 64),
    text.truncate(item.summary, 40),
    item.region,
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackSuppressionGroupViews(items: FallbackSuppressionGroup[]): FallbackSuppressionGroupView[] {
  const views: FallbackSuppressionGroupView[] = [];
  for (const item of items) {
    views.push(toFallbackSuppressionGroupView(item));
  }
  return views;
}

export function sumFallbackSuppressionGroupView(view: FallbackSuppressionGroupView): number {
  const parsedAmount = Number(view.amountText);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amountText} is not a number`);
  const parsedLimit = Number(view.limit);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limit} is not a number`);
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  return parsedAmount + parsedLimit + parsedCapacity;
}
