import * as text from "../../../../kit/text.js";
import { FallbackPathQuota } from "./fallback-path-quota.js";

/** How screens and exports show a fallback path quota. */
export class FallbackPathQuotaView {
  code: string;
  label: string;
  version: string;
  categoryText: string;
  currency: string;
  contactEmail: string;
  costText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    version: string,
    categoryText: string,
    currency: string,
    contactEmail: string,
    costText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.categoryText = categoryText;
    this.currency = currency;
    this.contactEmail = contactEmail;
    this.costText = costText;
    this.statusLabel = statusLabel;
  }
}

export function toFallbackPathQuotaView(item: FallbackPathQuota): FallbackPathQuotaView {
  return new FallbackPathQuotaView(
    text.truncate(item.code, 64),
    text.truncate(item.label, 64),
    String(item.version),
    text.truncate(item.category, 120),
    text.truncate(item.currency, 64),
    item.contactEmail,
    item.cost.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toFallbackPathQuotaViews(items: FallbackPathQuota[]): FallbackPathQuotaView[] {
  const views: FallbackPathQuotaView[] = [];
  for (const item of items) {
    views.push(toFallbackPathQuotaView(item));
  }
  return views;
}

export function sumFallbackPathQuotaView(view: FallbackPathQuotaView): number {
  const parsedVersion = Number(view.version);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.version} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  return parsedVersion + parsedCost;
}
