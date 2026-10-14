import * as text from "../../../../kit/text.js";
import { PendingSubscriptionManifest } from "./pending-subscription-manifest.js";

/** How screens and exports show a pending subscription manifest. */
export class PendingSubscriptionManifestView {
  code: string;
  titleText: string;
  windowDays: string;
  localeText: string;
  limitText: string;
  approved: string;
  weightText: string;
  budget: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    windowDays: string,
    localeText: string,
    limitText: string,
    approved: string,
    weightText: string,
    budget: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.windowDays = windowDays;
    this.localeText = localeText;
    this.limitText = limitText;
    this.approved = approved;
    this.weightText = weightText;
    this.budget = budget;
    this.statusLabel = statusLabel;
  }
}

export function toPendingSubscriptionManifestView(item: PendingSubscriptionManifest): PendingSubscriptionManifestView {
  return new PendingSubscriptionManifestView(
    item.code,
    text.truncate(item.title, 80),
    String(item.windowDays),
    item.locale,
    String(item.limit),
    `${item.approved}`,
    item.weight.toFixed(2),
    item.budget.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingSubscriptionManifestViews(items: PendingSubscriptionManifest[]): PendingSubscriptionManifestView[] {
  const views: PendingSubscriptionManifestView[] = [];
  for (const item of items) {
    views.push(toPendingSubscriptionManifestView(item));
  }
  return views;
}

export function sumPendingSubscriptionManifestView(view: PendingSubscriptionManifestView): number {
  const parsedWindowDays = Number(view.windowDays);
  if (Number.isNaN(parsedWindowDays)) throw new Error(`parse window days: ${view.windowDays} is not a number`);
  const parsedLimit = Number(view.limitText);
  if (Number.isNaN(parsedLimit)) throw new Error(`parse limit: ${view.limitText} is not a number`);
  const parsedWeight = Number(view.weightText);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weightText} is not a number`);
  return parsedWindowDays + parsedLimit + parsedWeight;
}
