import * as text from "../../../../kit/text.js";
import { GlobalSlaDigest } from "./global-sla-digest.js";

/** How screens and exports show a global sla digest. */
export class GlobalSlaDigestView {
  code: string;
  title: string;
  windowDays: string;
  conversionRate: string;
  contactEmail: string;
  priorityText: string;
  category: string;
  pinnedText: string;
  cost: string;
  expiresAt: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    windowDays: string,
    conversionRate: string,
    contactEmail: string,
    priorityText: string,
    category: string,
    pinnedText: string,
    cost: string,
    expiresAt: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
    this.priorityText = priorityText;
    this.category = category;
    this.pinnedText = pinnedText;
    this.cost = cost;
    this.expiresAt = expiresAt;
    this.statusLabel = statusLabel;
  }
}

export function toGlobalSlaDigestView(item: GlobalSlaDigest): GlobalSlaDigestView {
  return new GlobalSlaDigestView(
    text.truncate(item.code, 40),
    text.truncate(item.title, 64),
    String(item.windowDays),
    item.conversionRate.toFixed(2),
    item.contactEmail,
    String(item.priority),
    text.truncate(item.category, 64),
    `${item.pinned}`,
    item.cost.toFixed(2),
    String(item.expiresAt),
    `${item.status}`.toUpperCase(),
  );
}

export function toGlobalSlaDigestViews(items: GlobalSlaDigest[]): GlobalSlaDigestView[] {
  const views: GlobalSlaDigestView[] = [];
  for (const item of items) {
    views.push(toGlobalSlaDigestView(item));
  }
  return views;
}

export function sumGlobalSlaDigestView(view: GlobalSlaDigestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  const parsedPriority = Number(view.priorityText);
  if (Number.isNaN(parsedPriority)) throw new Error(`parse priority: ${view.priorityText} is not a number`);
  return parsedWindowDays + parsedConversionRate + parsedPriority;
}
